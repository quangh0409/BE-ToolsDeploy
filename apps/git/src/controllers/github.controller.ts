import { HttpError, HttpStatus, Result, ResultSuccess, success } from "app";
import axios from "axios";
import Github from "../models/git";
import { v1 } from "uuid";
import { createUser } from "../services/user.service";
import { login } from "../services/auth.service";
import { findTicketByUserId } from "../services/ticket.service";
import { error } from "app";
import { configs } from "../configs";

export async function createGitHub(params: {
    access_token: string;
    token_type: string;
    scope?: string;
    git_id: string;
    git_user: string;
}): Promise<ResultSuccess> {
    const check = await Github.findOne({ git_id: params.git_id });

    if (check) {
        throw new HttpError({
            status: HttpStatus.BAD_REQUEST,
            code: "GITHUB_EXITSED",
            errors: [
                {
                    param: "user_id",
                    location: "body",
                    value: params.git_id,
                },
            ],
        });
    }

    const github = new Github({
        id: v1(),
        git_id: params.git_id,
        access_token: params.access_token,
        token_type: params.token_type,
        scope: params.scope,
        git_user: params.git_user,
    });

    await github.save();

    return success.ok(github);
}

export async function updateGitHub(params: {
    access_token: string;
    token_type: string;
    scope?: string;
    git_id: string;
    git_user: string;
}): Promise<ResultSuccess> {
    const check = await Github.findOneAndUpdate(
        { git_id: params.git_id },
        {
            $set: {
                access_token: params.access_token,
                token_type: params.token_type,
                scope: params.scope,
                git_user: params.git_user,
            },
        },
        { new: true }
    );

    if (!check) {
        throw new HttpError({
            status: HttpStatus.BAD_REQUEST,
            code: "GITHUB_EXITSED",
            errors: [
                {
                    param: "user_id",
                    location: "body",
                    value: params.git_id,
                },
            ],
        });
    }

    return success.ok({ ...check.toJSON(), _id: undefined });
}

export async function getGitHubById(params: {
    git_id: string;
}): Promise<ResultSuccess> {
    const check = await Github.findOne({ git_id: params.git_id });

    if (!check) {
        throw new HttpError({
            status: HttpStatus.NOT_FOUND,
            code: "GITHUB_NOT_EXITS",
            errors: [
                {
                    param: "git_id",
                    location: "params",
                    value: params.git_id,
                },
            ],
        });
    }

    return success.ok({ ...check.toJSON(), _id: undefined });
}

export async function getAGithubByCode(params: {
    code: string;
}): Promise<Result> {
    const client_id = configs.github.clientId;
    const client_secret = configs.github.clientSecret;

    try {
        const response = await axios.post(
            `https://github.com/login/oauth/access_token?client_id=${client_id}&client_secret=${client_secret}&code=${params.code}&scope=repo`,
            {
                headers: {
                    Accept: "application/json",
                },
            }
        );

        const data: {
            access_token: string;
            scope: string;
            token_type: string;
        } = parseAccessToken(response.data);

        if (data.access_token) {
            return success.ok(data);
        }
        return success.ok(response.data);
    } catch (error) {
        return {
            status: HttpStatus.INTERNAL_SERVER,
            code: "ACCOUNT_IS_INACTIVE",
            errors: [
                {
                    location: "body",
                    param: "email",
                    message: "Internal Server Error",
                },
            ],
        };
    }
}

export async function GetInfoUserGitByAccesToken(params: {
    access_token: string;
}): Promise<ResultSuccess> {
    const response = await axios.get(`https://api.github.com/user`, {
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${params.access_token}`,
        },
    });

    return success.ok(response.data);
}

export async function GetInfoUserGit(params: {
    userId: string;
}): Promise<ResultSuccess> {
    const ticket = await findTicketByUserId({ user_id: params.userId });

    const github = await Github.findOne({ git_id: ticket.body?.github_id });

    if (!github) {
        throw new HttpError(
            error.notFound({
                location: "token",
                param: "token",
                message: "git_id of user_id not exits",
            })
        );
    }

    const response = await axios.get(`https://api.github.com/user`, {
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${github.access_token}`,
        },
    });

    return success.ok(response.data);
}

export async function GetReposGitByAccessToken(params: { userId: string , name?: string }) {
    const ticket = await findTicketByUserId({ user_id: params.userId });

    const github = await Github.findOne({ git_id: ticket.body?.github_id });

    if (!github) {
        throw new HttpError(
            error.notFound({
                location: "token",
                param: "token",
                message: "git_id of user_id not exits",
            })
        );
    }

    const response = await axios.get(
        `https://api.github.com/users/${github.git_user}/repos`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${github.access_token}`,
                "X-GitHub-Api-Version": "2022-11-28",
            },
        }
    );

    let result = response.data;

    if(params.name){
        result = result.filter((res: any) => {
            if(res.name.includes(params.name)){
                return res;
            }
        })
    }

    return success.ok({ data: result });
}

export async function GetBranchesByAccessToken(params: {
    userId: string;
    repository: string;
}) {
    const ticket = await findTicketByUserId({ user_id: params.userId });

    const github = await Github.findOne({ git_id: ticket.body?.github_id });

    if (!github) {
        throw new HttpError(
            error.notFound({
                location: "token",
                param: "token",
                message: "git_id of user_id not exits",
            })
        );
    }

    const response = await axios.get(
        `https://api.github.com/repos/${github.git_user}/${params.repository}/branches`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${github.access_token}`,
                "X-GitHub-Api-Version": "2022-11-28",
            },
        }
    );

    const dataArray = response.data.map((branch: any) => ({
        branch: branch.name,
    }));

    return success.ok({ data: dataArray });
}

export async function GetLanguagesByAccessToken(params: {
    userId: string;
    repository: string;
}) {
    const ticket = await findTicketByUserId({ user_id: params.userId });

    const github = await Github.findOne({ git_id: ticket.body?.github_id });

    if (!github) {
        throw new HttpError(
            error.notFound({
                location: "token",
                param: "token",
                message: "git_id of user_id not exits",
            })
        );
    }

    const response = await axios.get(
        `https://api.github.com/repos/${github.git_user}/${params.repository}/languages`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${github.access_token}`,
                "X-GitHub-Api-Version": "2022-11-28",
            },
        }
    );

    const dataArray = Object.entries(response.data).map(
        ([language, number]) => ({
            language,
            number,
        })
    );

    return success.ok({ data: dataArray });
}

export async function GetPathFileDockerByAccessToken(params: {
    userId: string;
    repository: string;
    branch: string;
}) {
    const ticket = await findTicketByUserId({ user_id: params.userId });

    const github = await Github.findOne({ git_id: ticket.body?.github_id });

    if (!github) {
        throw new HttpError(
            error.notFound({
                location: "token",
                param: "token",
                message: "git_id of user_id not exits",
            })
        );
    }
    const response = await axios.get(
        `https://api.github.com/repos/${github.git_user}/${params.repository}/git/trees/${params.branch}?recursive=1`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${github.access_token}`,
                "X-GitHub-Api-Version": "2022-11-28",
            },
        }
    );

    let path_Dockerfile: { path: string; name: string; content: string }[] = [];
    let path_docker_compose: { path: string; name: string; content: string }[] =
        [];

    for (const t of response.data.tree) {
        if (t.path.toLowerCase().includes("dockerfile")) {
            const file_name = t.path.split("/");
            const res = await GetContentsByAccessToken({
                userId: params.userId,
                sha: t.sha,
                repository: params.repository,
            });
            path_Dockerfile.push({
                path: t.path,
                name: file_name[file_name.length - 1],
                content: res.data.content,
            });
        }
        if (t.path.toLowerCase().includes("docker-compose")) {
            const file_name = t.path.split("/");
            const res = await GetContentsByAccessToken({
                userId: params.userId,
                sha: t.sha,
                repository: params.repository,
            });
            path_docker_compose.push({
                path: t.path,
                name: file_name[file_name.length - 1],
                content: res.data.content,
            });
        }
    }

    return success.ok({
        dockerfile: path_Dockerfile,
        docker_compose: path_docker_compose,
    });
}

export async function GetContentsByAccessToken(params: {
    userId: string;
    repository: string;
    sha: string;
}) {
    const ticket = await findTicketByUserId({ user_id: params.userId });

    const github = await Github.findOne({ git_id: ticket.body?.github_id });

    if (!github) {
        throw new HttpError(
            error.notFound({
                location: "token",
                param: "token",
                message: "git_id of user_id not exits",
            })
        );
    }
    const response = await axios.get(
        `https://api.github.com/repos/${github.git_user}/${params.repository}/git/blobs/${params.sha}`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${github.access_token}`,
                "X-GitHub-Api-Version": "2022-11-28",
            },
        }
    );

    const content = Buffer.from(
        response.data.content,
        response.data.encoding
    ).toString("utf-8");

    return success.ok({ content });
}

export async function GetLastCommitByAccessToken(params: {
    userId: string;
    repository: string;
    branch: string;
}) {
    const ticket = await findTicketByUserId({ user_id: params.userId });

    const github = await Github.findOne({ git_id: ticket.body?.github_id });

    if (!github) {
        throw new HttpError(
            error.notFound({
                location: "token",
                param: "token",
                message: "git_id of user_id not exits",
            })
        );
    }
    ///repos/:owner/:repo/commits/master
    const response = await axios.get(
        `https://api.github.com/repos/${github.git_user}/${params.repository}/commits/${params.branch}`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${github.access_token}`,
                "X-GitHub-Api-Version": "2022-11-28",
            },
        }
    );

    const result = response.data;

    return success.ok({
        commit_id: result.sha,
        commit_message: result.commit.message,
        branch: params.branch,
        repository: params.repository,
        committer: result.commit.committer.name,
        url: result.html_url,
    });
}

export async function CreateReleaseByAccessToken(params: {
    userId: string;
    repository: string;
    tag_name: string;
    target_commitish: string;
    name: string;
    body: string;
}) {
    const ticket = await findTicketByUserId({ user_id: params.userId });

    const github = await Github.findOne({ git_id: ticket.body?.github_id });

    if (!github) {
        throw new HttpError(
            error.notFound({
                location: "token",
                param: "token",
                message: "git_id of user_id not exits",
            })
        );
    }

    const response = await axios.post(
        `https://api.github.com/repos/${github.git_user}/${params.repository}/releases`,
        {
            tag_name: params.tag_name,
            target_commitish: params.target_commitish,
            name: params.name,
            body: params.body,
            draft: false,
            prerelease: false,
            generate_release_notes: false,
            // tag: { // Add this object to create the tag
            //     object: params.target_commitish, // The commit SHA to tag
            //     type: "commit",
            //     tag: params.tag_name,
            //     message: "Creating tag for release" // Optional message for the tag
            // }
        },
        {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${github.access_token}`,
                "X-GitHub-Api-Version": "2022-11-28",
                "X-OAuth-Scopes": "admin:repo_hooks",
                "X-Accepted-OAuth-Scopes": "admin:repo_hooks",
            },
        }
    );

    return success.ok({ data: response });
}

function parseAccessToken(input: string): {
    access_token: string;
    scope: string;
    token_type: string;
} {
    const parts = input.split("&");
    const result: { access_token: string; scope: string; token_type: string } =
        {
            access_token: "",
            scope: "",
            token_type: "",
        };

    for (const part of parts) {
        const [key, value] = part.split("=");
        if (key === "access_token") {
            result.access_token = value;
        } else if (key === "scope") {
            result.scope = value;
        } else if (key === "token_type") {
            result.token_type = value;
        }
    }

    return result;
}

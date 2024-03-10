import { HttpStatus, Result, success } from "app";
import axios from "axios";

export async function GetAccessTokenByCode(params: {
    code: string;
}): Promise<Result> {
    const param = new URLSearchParams();
    param.append("client_id", "d07893f17582c895aefd");
    param.append("client_secret", "ed9bdfeacb15439ac04a4f314e7c35d83b1a5f67");
    param.append("code", params.code);

    try {
        const response = await axios.post(
            "https://github.com/login/oauth/access_token",
            param,
            {
                headers: {
                    Accept: "application/json",
                },
            }
        );

        const data = response.data;

        if (data.access_token) {
            const token = data.access_token;
            const render = `Successfully authorized! Got code ${
                params.code
            } and exchanged it for a user access token ending in ${token.slice(
                -9
            )}.`;
            return success.ok({ data: data });
        } else {
            const render = `Authorized, but unable to exchange code ${params.code} for token.`;
            return success.ok({ data: data, code: params.code });
        }
    } catch (error) {
        console.error(error);
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
    access_token_git: string;
}): Promise<Result> {
    const response = await axios.get(`https://api.github.com/user`, {
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${params.access_token_git}`,
        },
    });

    return success.ok({ data: response.data });
}

export async function GetReposGitByAccessToken(params: {
    access_token_git: string;
    user: string;
}) {
    const response = await axios.get(
        `https://api.github.com/users/${params.user}/repos`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${params.access_token_git}`,
                "X-GitHub-Api-Version": "2022-11-28",
            },
        }
    );

    return success.ok({ data: response.data });
}

export async function GetBranchesByAccessToken(params: {
    access_token_git: string;
    user: string;
    repository: string;
}) {
    const response = await axios.get(
        `https://api.github.com/repos/${params.user}/${params.repository}/branches`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${params.access_token_git}`,
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
    access_token_git: string;
    user: string;
    repository: string;
}) {
    const response = await axios.get(
        `https://api.github.com/repos/${params.user}/${params.repository}/languages`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${params.access_token_git}`,
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

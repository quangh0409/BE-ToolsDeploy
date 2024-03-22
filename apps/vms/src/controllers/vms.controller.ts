import { HttpError, HttpStatus, ResultSuccess, success } from "app";
import { resolve } from "path";
import fs from "fs";
import SftpClient from "ssh2-sftp-client";

import { NodeSSH } from "node-ssh";

export async function sshInstallDocker(): Promise<ResultSuccess> {
    const ssh = new NodeSSH();
    const path = __dirname;
    const file_path = resolve(path, "../../", "file/win/id_rsa");
    const file_path_docker = resolve(
        path,
        "../../",
        "file/win/docker-setup.sh"
    );

    // Đọc nội dung của file RSA vào biến privateKey
    const privateKey = fs.readFileSync(file_path).toString();
    const conent: Buffer = fs.readFileSync(file_path);

    await ssh.connect({
        host: "23.102.237.66",
        username: "quang_vt204299",
        privateKey: privateKey,
    });
    await ssh.execCommand("mkdir -p docker && touch docker/docker-setup.sh");
    const content = fs.readFileSync(file_path);
    await ssh.execCommand(`echo '${content}' > docker/docker-setup.sh`);
    await ssh.execCommand(
        "chmod +x docker/docker-setup.sh && ./docker/docker-setup.sh"
    );
    await ssh.execCommand("sudo usermod -aG docker $USER");
    await ssh.execCommand("sudo systemctl restart docker");

    // const sftp = new SftpClient();
    // await sftp.connect({
    //     host: "23.102.237.66",
    //     username: "quang_vt204299",
    //     privateKey: privateKey,
    // });

    // // await sftp.chmod("docker/docker-setup.sh", 0o777);

    // await sftp.put(conent, "docker/docker-setup.sh");

    return success.ok({ result: "Install Docker Successfull" });
}

export async function sshCheckConnect(): Promise<ResultSuccess> {
    const ssh = new NodeSSH();
    const path = __dirname;
    const file_path = resolve(path, "../../", "file/win/id_rsa");
    const file_path_docker = resolve(
        path,
        "../../",
        "file/win/docker-setup.sh"
    );

    // Đọc nội dung của file RSA vào biến privateKey
    const privateKey = fs.readFileSync(file_path).toString();

    await ssh.connect({
        host: "23.102.237.66",
        username: "quang_vt204299",
        privateKey: privateKey,
    });

    return success.ok({ result: "Connect successfull" });
}

export async function sshCheckConnectDev(): Promise<ResultSuccess> {
    const ssh = new NodeSSH();
    const path = __dirname;
    const file_path = resolve(path, "../../", "file/id_rsa");

    // Đọc nội dung của file RSA vào biến privateKey
    const privateKey = fs.readFileSync(file_path).toString();

    await ssh.connect({
        host: "23.102.228.99",
        username: "gitlab",
        privateKey: privateKey,
    });
    await ssh.execCommand("mkdir -p test ");

    return success.ok({ result: "Connect successfull" });
}

export async function sshInstallDockerDev(): Promise<ResultSuccess> {
    const ssh = new NodeSSH();
    const path = __dirname;
    const file_path = resolve(path, "../../", "file/id_rsa");
    const file_path_docker = resolve(
        path,
        "../../",
        "file/win/docker-setup.sh"
    );

    // Đọc nội dung của file RSA vào biến privateKey
    const privateKey = fs.readFileSync(file_path).toString();
    const content: Buffer = fs.readFileSync(file_path_docker);

    await ssh.connect({
        host: "23.102.228.99",
        username: "gitlab",
        privateKey: privateKey,
    });
    // await ssh.execCommand("mkdir -p docker && touch docker/docker-setup.sh");
    // // const content = fs.readFileSync(file_path);
    // await ssh.execCommand(`echo '${content}' > docker/docker-setup.sh`);
    // const run = await ssh.execCommand(
    //     "chmod +x docker/docker-setup.sh && cd docker && ./docker-setup.sh"
    // );

    
    // await ssh.execCommand("sudo apt-get update");
    // await ssh.execCommand(
    //     "sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release"
    // );
    // await ssh.execCommand(
    //     "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg"
    // );
    // await ssh.execCommand(`echo \\
    // \"deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \\
    // $(lsb_release -cs) stable\\" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null`);
    // await ssh.execCommand("sudo apt-get update");
    // await ssh.execCommand(
    //     "sudo apt-get install -y docker-ce docker-ce-cli containerd.io"
    // );
    // await ssh.execCommand(
    //     `sudo curl -L \"https://github.com/docker/compose/releases/download/1.29.2/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose`
    // );
    // await ssh.execCommand("sudo chmod +x /usr/local/bin/docker-compose");

    await ssh.execCommand("sudo usermod -aG docker $USER");
    await ssh.execCommand("sudo systemctl restart docker");

    return success.ok({ result: "success full" });
}

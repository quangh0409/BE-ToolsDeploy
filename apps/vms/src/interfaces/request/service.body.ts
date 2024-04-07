export interface IServiceBody {
    name: string;
    architectura: string;
    language: string;
    repo: string;
    source: string;
    user: string;
    environments: IEnvironment[];
}

export interface IEnvironment {
    name: string;
    vm: string;
    branch: string;
    docker_file: [
        {
            location: string;
            content: string;
            name: string;
        }
    ];
    docker_compose: [
        {
            location: string;
            content: string;
            name: string;
        }
    ];
}

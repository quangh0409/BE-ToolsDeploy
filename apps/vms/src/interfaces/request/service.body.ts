export interface IServiceBody {
    name: string;
    architectura: string;
    language: string;
    repo: string;
    source: string;
    environment: [
        {
            name: string;
            vm: string;
            branch: string;
            docker_file: {
                location: string;
                content: string;
                name: string;
            };
            docker_compose: {
                location: string;
                content: string;
                name: string;
            };
        }
    ];
}

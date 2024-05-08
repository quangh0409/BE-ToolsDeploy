export interface IService {
    id: string;
    name: string;
    architectura: string;
    language: string;
    repo: string;
    source: string;
    user: string;
    environment: {
        name: string;
        vm: string;
        branch: string;
        status?: string;
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
        postman: {
            collection: {
                content: string;
                name: string;
            };
            environment: {
                content: string;
                name: string;
            };
        };
        record: string[];
    }[];
}

node {
  stage("ssh"){
     withCredentials([file(credentialsId: 'ssh_key_remote', variable: 'ssh_key_remote')]) {
        sh "cat $ssh_key_remote > ssh_id_rsa"
        sh "chmod 400 ssh_id_rsa"
        sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'whoami'"
    }
  }
  stage("Clone"){
   withCredentials([file(credentialsId: 'ssh_key_remote', variable: 'ssh_key_remote')]) {
        sh "cat $ssh_key_remote > ssh_id_rsa"
        sh "chmod 400 ssh_id_rsa"
        sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'git clone https://github.com/quangh0409/BE-ToolsDeploy.git 2> /dev/null || (rm -rf BE-ToolsDeploy ; git clone https://github.com/quangh0409/BE-ToolsDeploy.git) '"
    }
  }
  stage("ScanSyntax"){
   withCredentials([file(credentialsId: 'ssh_key_remote', variable: 'ssh_key_remote')]) {
        sh "cat $ssh_key_remote > ssh_id_rsa"
        sh "chmod 400 ssh_id_rsa"
        sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 './scan_image.sh 2> /dev/null '"
        sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'cat ScanDockerCompose.json && cat ScanDockerImage.json '"
    }
  }
  stage("Clear"){
    withCredentials([file(credentialsId: 'ssh_key_remote', variable: 'ssh_key_remote')]) {
        sh "cat $ssh_key_remote > ssh_id_rsa"
        sh "chmod 400 ssh_id_rsa"
        // sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 '(docker stop \$(docker ps -aq)  || echo no container) &&  (docker rmi -f \$(docker images -q) || echo no image) && docker builder prune -f'"
        sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'docker builder prune -f'"
    }
  }
  stage("Build"){
    withCredentials([file(credentialsId: 'ssh_key_remote', variable: 'ssh_key_remote')]) {
        sh "cat $ssh_key_remote > ssh_id_rsa"
        sh "chmod 400 ssh_id_rsa"
        sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'cd BE-ToolsDeploy && chmod +x ./nginx/entrypoint.sh && chmod +x docker-compose.yaml  && docker compose -f ./docker-compose.yaml build'"
    }
  }
  stage("ScanImages"){
    withCredentials([file(credentialsId: 'ssh_key_remote', variable: 'ssh_key_remote')]) {
        sh "cat $ssh_key_remote > ssh_id_rsa"
        sh "chmod 400 ssh_id_rsa"
        sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'trivy image vutrongquang/auth'"
        sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'trivy image vutrongquang/gateway'"
    }
  }
  stage("Clear"){
    withCredentials([file(credentialsId: 'ssh_key_remote', variable: 'ssh_key_remote')]) {
        sh "cat $ssh_key_remote > ssh_id_rsa"
        sh "chmod 400 ssh_id_rsa"
        sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'docker builder prune -f'"
    }
  }
  stage("Deploy"){
    withCredentials([file(credentialsId: 'ssh_key_remote', variable: 'ssh_key_remote')]) {
        sh "cat $ssh_key_remote > ssh_id_rsa"
        sh "chmod 400 ssh_id_rsa"
        sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'cd BE-ToolsDeploy && docker compose -f ./docker-compose.yaml up --build -d'"
     }
  }
  // stage("Test"){
  //   withCredentials([file(credentialsId: 'ssh_key_remote', variable: 'ssh_key_remote')]) {
  //       sh "cat $ssh_key_remote > ssh_id_rsa"
  //       sh "chmod 400 ssh_id_rsa"
  //       sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.168.177 'cd CHECK-P-ToolsDeploy/ && docker compose up --build'"
  //    }    
  //       // println("I am Test")
  //       // sh "whoami"
  //       // sh "pwd"
  //       // sh "cd ~/../home/quang_vt204299/CHECK-P-ToolsDeploy/ && docker compose -f ~/../home/quang_vt204299/CHECK-P-ToolsDeploy/ up --build"
  // }
}

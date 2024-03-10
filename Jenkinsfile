node {
  stage("ssh"){
     withCredentials([file(credentialsId: 'ssh-key', variable: 'ssh_key_remote')]) {
        sh "cat $ssh_key_remote > ssh_id_rsa"
        sh "chmod 400 ssh_id_rsa"
        sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'whoami'"
    }
  }
  stage("Clone"){
   withCredentials([file(credentialsId: 'ssh-key', variable: 'ssh_key_remote')]) {
        sh "cat $ssh_key_remote > ssh_id_rsa"
        sh "chmod 400 ssh_id_rsa"
        // sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'git clone https://github.com/quangh0409/BE-ToolsDeploy.git'"
        def remoteDir = "BE-ToolsDeploy"
        def process = new ProcessBuilder("ssh", "-o", "StrictHostKeyChecking=no", "-i", "ssh_id_rsa", "quang_vt204299@35.213.147.74", "[", "-d", "\"$remoteDir\"", "]", "&&", "echo", "\"exist\"", "||", "echo", "\"not exist\"").start()
        def dirStatus = process.inputStream.text.trim()

        if (dirStatus == "not exist") {
            sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'git clone https://github.com/quangh0409/BE-ToolsDeploy.git'"
        } else {
            echo "Directory already exists, skipping git clone"
            sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'git pull'"
        }
    }
  }
  stage("Build"){
    withCredentials([file(credentialsId: 'ssh-key', variable: 'ssh_key_remote')]) {
        sh "cat $ssh_key_remote > ssh_id_rsa"
        sh "chmod 400 ssh_id_rsa"
        sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'cd BE-ToolsDeploy'"
        sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'docker compose -f ./docker-compose-build.yaml up'"
    }
  }
  stage("Deploy"){
    withCredentials([file(credentialsId: 'ssh-key', variable: 'ssh_key_remote')]) {
        sh "cat $ssh_key_remote > ssh_id_rsa"
        sh "chmod 400 ssh_id_rsa"
        sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'cd BE-ToolsDeploy'"
        sh "ssh -o StrictHostKeyChecking=no -i ssh_id_rsa quang_vt204299@35.213.147.74 'docker compose -f ./docker-compose-deploy.yaml up --build'"
     }
  }
  stage("Test"){
    println("I'm Test")
  }
}

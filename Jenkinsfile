node {
  stage("Build"){
     withCredentials([file(credentialsId: 'ssh-key', variable: 'ssh_key_remote')]) {
        sh "cat $ssh_key_remote > ssh_id_rsa
        sh "chmod 400 ssh_id_rsa"
        sh "ssh -o StrictHostKeyChecking=no -i key quang_vt204299@35.213.147.74 'whoami'"
    }
  }
   stage("Deploy"){
    println("I'm Deploy")
  }
   stage("Test"){
    println("I'm Test")
     
  }
}

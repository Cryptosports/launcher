pipeline {
  agent {
    node {
      label 'mac'
    }

  }
  stages {
    stage('Compile') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run dist'
      }
    }

  }
}
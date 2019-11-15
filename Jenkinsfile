pipeline {
  agent {
    node {
      label 'mac'
    }

  }
  stages {
    stage('Compile') {
      steps {
        sh '''export PATH=/usr/local/bin:$PATH
npm run build'''
      }
    }

    stage('Build') {
      steps {
        sh '''export PATH=/usr/local/bin:$PATH
npm run dist'''
      }
    }

    stage('Complete') {
      steps {
        archiveArtifacts 'dist/tivoli-cloud.dmg'
      }
    }

  }
}
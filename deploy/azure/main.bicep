@description('Azure region for the Container Apps environment')
param location string = resourceGroup().location

@description('Container image containing the standalone plugin validation host')
param image string

@description('Resource name prefix')
param namePrefix string = 'ai-workflows'

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${namePrefix}-logs'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${namePrefix}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
  }
}

resource application 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${namePrefix}-app'
  location: location
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 7007
        transport: 'http'
      }
    }
    template: {
      containers: [
        {
          name: 'plugin-host'
          image: image
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/api/ai-workflows/health'
                port: 7007
              }
              initialDelaySeconds: 10
              periodSeconds: 20
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

output applicationUrl string = 'https://${application.properties.configuration.ingress.fqdn}'

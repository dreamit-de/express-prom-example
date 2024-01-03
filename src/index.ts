import { 
    GraphQLServer, 
    NoStacktraceJsonLogger 
} from '@dreamit/graphql-server'
import { 
    userSchema, 
    userSchemaResolvers 
} from './ExampleSchemas'
import express from 'express'
import bodyParser from 'body-parser'
import { 
    GraphQLServerRequest, 
    GraphQLServerResponse 
} from '@dreamit/graphql-server-base'
import { PromMetricsClient } from '@dreamit/graphql-prom-metrics'
import { Server } from 'node:http'

export function startWebServer(): Server {
    const graphqlServer = new GraphQLServer(
        {
            schema: userSchema,
            rootValue: userSchemaResolvers,

            /**
             * startWebServer is used in tests, we use a NoStacktraceJsonLogger to clean 
             * up the tests. In production, you should use the JsonLogger instead.
             */ 
            logger: new NoStacktraceJsonLogger('expressjs-server', 'user-service'),
            metricsClient: new PromMetricsClient()
        }
    )
    
    const graphQLServerPort = 7070
    const graphQLServerExpress = express()
    graphQLServerExpress.use(bodyParser.text({type: '*/*'}))
    graphQLServerExpress.all('/graphql', 
        (request: GraphQLServerRequest, response: GraphQLServerResponse) => {
            return graphqlServer.handleRequest(request, response)
        })
    graphQLServerExpress.get('/metrics', async(request, response) => {
        return response.contentType(graphqlServer.getMetricsContentType())
        .send(await graphqlServer.getMetrics())
    })    
    const server = graphQLServerExpress.listen({port: graphQLServerPort})
    console.info(`Starting GraphQL server on port ${graphQLServerPort}`)
    return server
}

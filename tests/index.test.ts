import {
    FETCH_ERROR,
    GRAPHQL_ERROR,
    INVALID_SCHEMA_ERROR,
    METHOD_NOT_ALLOWED_ERROR,
    MISSING_QUERY_PARAMETER_ERROR,
    SCHEMA_VALIDATION_ERROR,
    SYNTAX_ERROR,
    VALIDATION_ERROR,
} from '@dreamit/graphql-server-base'
import { startWebServer } from '~/src'
import { Server } from 'node:http'
import { 
    logoutMutation, 
    returnErrorQuery, 
    userOne, 
    userQuery, 
    usersQuery, 
    userTwo, 
    userVariables 
} from '@/ExampleSchemas'
import test, { after, before } from 'node:test'
import assert from 'node:assert'
import { ExecutionResult } from 'graphql'

let server: Server

before(() => {
    server = startWebServer() 
})

after(() => {
    server.close()
})

test('Should get correct responses for requests and metrics data', async() => {
    
    // Get initial metrics
    let response = await fetch('http://localhost:7070/metrics')
    let responseAsText = await response.text()
  
    assertContains(responseAsText, 'graphql_server_availability 1')
    assertContains(responseAsText,
        'graphql_server_request_throughput 0')
    assertContains(responseAsText,
        `graphql_server_errors{errorClass="${GRAPHQL_ERROR}"} 0`)
    assertContains(responseAsText,
        `graphql_server_errors{errorClass="${SCHEMA_VALIDATION_ERROR}"} 0`)
    assertContains(responseAsText,
        `graphql_server_errors{errorClass="${FETCH_ERROR}"} 0`)
    assertContains(responseAsText,
        `graphql_server_errors{errorClass="${METHOD_NOT_ALLOWED_ERROR}"} 0`)
    assertContains(responseAsText,
        `graphql_server_errors{errorClass="${INVALID_SCHEMA_ERROR}"} 0`)
    assertContains(responseAsText,
        `graphql_server_errors{errorClass="${MISSING_QUERY_PARAMETER_ERROR}"} 0`)
    assertContains(responseAsText,
        `graphql_server_errors{errorClass="${VALIDATION_ERROR}"} 0`)
    assertContains(responseAsText,
        `graphql_server_errors{errorClass="${SYNTAX_ERROR}"} 0`)

    
    // Get all users
    response = await fetch('http://localhost:7070/graphql', {
        method: 'POST',
        body: JSON.stringify({query: usersQuery}),
        headers: {'Content-Type': 'application/json'}
    })
    let responseAsJson : ExecutionResult  = await response.json() as ExecutionResult
    assert.deepStrictEqual(responseAsJson.data?.users, [userOne, userTwo])

    // Get user one
    response = await fetch('http://localhost:7070/graphql', {
        method: 'POST',
        body: JSON.stringify({query: userQuery, variables: JSON.parse(userVariables)}),
        headers: {'Content-Type': 'application/json'}
    })
    responseAsJson = await response.json() as ExecutionResult
    assert.deepStrictEqual(responseAsJson.data?.user, userOne)

    // Get user two
    response = await fetch('http://localhost:7070/graphql', {
        method: 'POST',
        body: JSON.stringify({query: userQuery, variables: {'id201':'2'}}),
        headers: {'Content-Type': 'application/json'}
    })
    responseAsJson = await response.json() as ExecutionResult
    assert.deepStrictEqual(responseAsJson.data?.user, userTwo)

    // Get unknown user
    response = await fetch('http://localhost:7070/graphql', {
        method: 'POST',
        body: JSON.stringify({query: userQuery, variables: {'id201':'3'}}),
        headers: {'Content-Type': 'application/json'}
    })
    responseAsJson = await response.json() as ExecutionResult
    assert(responseAsJson.errors)
    assert.equal(responseAsJson.errors[0].message, 'User for userid=3 was not found')

    // Get returnError response
    response = await fetch('http://localhost:7070/graphql', {
        method: 'POST',
        body: JSON.stringify({query: returnErrorQuery}),
        headers: {'Content-Type': 'application/json'}
    })
    responseAsJson = await response.json() as ExecutionResult
    assert(responseAsJson.errors)
    assert.equal(responseAsJson.errors[0].message, 'Something went wrong!')

    // Get logout mutation response
    response = await fetch('http://localhost:7070/graphql', {
        method: 'POST',
        body: JSON.stringify({query: logoutMutation}),
        headers: {'Content-Type': 'application/json'}
    })
    responseAsJson = await response.json() as ExecutionResult
    assert.deepStrictEqual(responseAsJson.data?.logout, {result: 'Goodbye!'})

    // Get final metrics
    response = await fetch('http://localhost:7070/metrics')
    responseAsText = await response.text()
    assertContains(responseAsText,
        'graphql_server_availability 1')
    assertContains(responseAsText,
        'graphql_server_request_throughput 6')
    assertContains(responseAsText,
        `graphql_server_errors{errorClass="${GRAPHQL_ERROR}"} 2`)
    assertContains(responseAsText,
        `graphql_server_errors{errorClass="${SCHEMA_VALIDATION_ERROR}"} 0`)
    assertContains(responseAsText,
        `graphql_server_errors{errorClass="${FETCH_ERROR}"} 0`)
    assertContains(responseAsText,
        `graphql_server_errors{errorClass="${METHOD_NOT_ALLOWED_ERROR}"} 0`)
    assertContains(responseAsText,
        `graphql_server_errors{errorClass="${INVALID_SCHEMA_ERROR}"} 0`)
    assertContains(responseAsText,
        `graphql_server_errors{errorClass="${MISSING_QUERY_PARAMETER_ERROR}"} 0`)
    assertContains(responseAsText,
        `graphql_server_errors{errorClass="${VALIDATION_ERROR}"} 0`)
    assertContains(responseAsText,
        `graphql_server_errors{errorClass="${SYNTAX_ERROR}"} 0`)
})

function assertContains(actual: string, expected: string): asserts actual is string {
    assert(actual.includes(expected), `${actual} does not contain ${expected}`)
}
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLScalarType
} = require('graphql')

const promisify = aFunction => new Promise((resolve, reject) => {
  aFunction((error, result) => {
    if(error) {
      reject(error)
    } else {
      resolve(result)
    }
  })
})

const notEmpty = (arg) => {
  return (typeof arg !== 'undefined') && arg.length > 0
}

const scanParams = (first, durations, styles, levels, languages) => {

  let expressionAttributeNames = {}
  let expressionAttributeValues = {}
  let filterExpressions = []

  if (typeof first == 'undefined')
    first = 30
  
  if (notEmpty(durations)) {
    expressionAttributeNames['#duration'] = 'duration'
    let expressions = []
    
    for (let index = 0; index < durations.length; index++) {
      expressionAttributeValues[':gte'+index] = durations[index].gte
      expressionAttributeValues[':lte'+index] = durations[index].lte

      expressions.push('(#duration BETWEEN' + ' :gte'+index+ ' AND :lte'+index+')')
    }

    filterExpressions.push('(' + expressions.join(' OR ') + ')')
  }

  if (notEmpty(styles)) {
    expressionAttributeNames['#style'] = 'style'
    
    for (let index = 0; index < styles.length; index++) {
      expressionAttributeValues[':style' + index] = styles[index]  
    }
    
    var attributeValues = styles.map((x, i) => ':style'+i).join(',')
    filterExpressions.push('#style IN (' + attributeValues + ')')
  }

  if (notEmpty(levels)) {
    expressionAttributeNames['#level'] = 'level'

    for (let index = 0; index < levels.length; index++)
      expressionAttributeValues[':level' + index] = levels[index]  

    var attributeValues = levels.map((x, i) => ':levels'+i).join(',')
    filterExpressions.push('#level IN (' + attributeValues.join(',') + ')')
  }

  if (notEmpty(languages)) {
    expressionAttributeNames['#language'] = 'language'
    
    for (let index = 0; index < languages.length; index++)
      expressionAttributeValues[':language' + index] = languages[index]  
    
    var attributeValues = languages.map((x, i) => ':languages'+i).join(',')
    filterExpressions.push('#language IN (' + languageKeysForValues.join(',') + ')')
  }

  if (filterExpressions.length >= 1)
    return {
      TableName: process.env.DYNAMODB_TABLE,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      FilterExpression: filterExpressions.join(' AND '),
      Limit: first
    }
  else
    return {
      TableName: process.env.DYNAMODB_TABLE,
      Limit: first
    }
}

const getClasses = args => promisify(callback => 
  dynamoDb.scan(scanParams(args.first, args.durations, args.styles, args.levels, args.languages), callback))
  .then(
    result => {
      let endCursor = result['LastEvaluatedKey']
      let hasNextPage = (result['Count'] < result['ScannedCount'])

      return JSON.stringify({
        classes: result['Items'],
        pageInfo: {
          hasNextPage: hasNextPage,
          endCursor: endCursor
        }
      })
    }
  )

const GraphQLRange = new GraphQLInputObjectType({
  name: 'GraphQLRange',
  fields: {
    gte: { name: 'gte', type: GraphQLInt },
    lte: { name: 'lte', type: GraphQLInt }
  }
})

const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    classes: {
      args: { 
        //page: { name: 'page', type: new GraphQLNonNull(GraphQLInt) },
        first: { name: 'first', type: GraphQLInt },
        after: { name: 'after', type: GraphQLInt },
        durations: { name: 'durations', type: GraphQLList(GraphQLRange)},
        styles: { name: 'styles', type: GraphQLList(GraphQLString) },
        levels: { name: 'levels', type: GraphQLList(GraphQLInt) },
        languages: { name: 'languages', type: GraphQLList(GraphQLString) }
      },
      type: GraphQLString,
      resolve: (parent, args) => getClasses(args)
    }
  }
})

const schema = new GraphQLSchema({
  query: queryType
})

// We want to make a GET request with ?query=<graphql query>
module.exports.query = (event, context, callback) => graphql(schema, event.queryStringParameters.query)
  .then(
    result => callback(null, {statusCode: 200, body: JSON.stringify(result)}),
    err => callback(err)
  )

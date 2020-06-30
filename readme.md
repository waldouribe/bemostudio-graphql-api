# Deploy
`serverless deploy --stage production`

# Test
curl -G 'https://6h1g7m2au6.execute-api.us-east-2.amazonaws.com/dev/query' --data-urlencode 'query={classes(page: 1)}'

# Tutorials
## Global Indexs
https://gist.github.com/DavidWells/c7df5df9c3e5039ee8c7c888aece2dd5

## Global secondary index
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html


## Projections
https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Projection.html

## Query and Scan
https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/dynamodb-example-query-scan.html

## Pagination
https://graphql.org/learn/pagination/


# Example response graphQL
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "friendsConnection": {
        "totalCount": 3,
        "edges": [
          {
            "node": {
              "name": "Han Solo"
            },
            "cursor": "Y3Vyc29yMg=="
          },
          {
            "node": {
              "name": "Leia Organa"
            },
            "cursor": "Y3Vyc29yMw=="
          }
        ],
        "pageInfo": {
          "endCursor": "Y3Vyc29yMw==",
          "hasNextPage": false
        }
      }
    }
  }
}
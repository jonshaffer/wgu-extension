interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: any;
  }>;
}

export async function graphqlQuery<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse<T>> {
  const endpoint = process.env.NODE_ENV === 'production' 
    ? 'https://us-central1-wgu-extension.cloudfunctions.net/graphql/graphql'
    : 'http://localhost:5001/wgu-extension/us-central1/graphql/graphql';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('GraphQL query error:', error);
    return {
      errors: [{
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }]
    };
  }
}
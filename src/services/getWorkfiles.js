import { ayonApi } from './ayon'

const WORKFILES_QUERY = `
query WorkfilesByTask($projectName: String!, $taskIds: [String!]!) {
  project(name: $projectName) {
    workfiles(taskIds:$taskIds) {
      edges {
        node {
          id
          taskId
          name
          path
        }
      }
    }
  }
}
`

// get workfile by id api
// `/api/projects/${projectName}/workfiles/${workfileId}`

const getWorkfiles = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getWorkfileList: build.query({
      query: ({ projectName, taskIds }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: WORKFILES_QUERY,
          variables: { projectName, taskIds },
        },
      }),
      transformResponse: (response) =>
        response.data.project.workfiles.edges.map((edge) => ({
          id: edge.node.id,
          taskId: edge.node.taskId,
          name: edge.node.name,
          path: edge.node.path,
        })),
      transformErrorResponse: (error) => error.data?.detail || `Error ${error.status}`,
    }),
    getWorkfileById: build.query({
      query: ({ projectName, id }) => ({
        url: `/api/projects/${projectName}/workfiles/${id}`,
      }),
      transformErrorResponse: (error) => error.data?.detail || `Error ${error.status}`,
      providesTags: (result, error, { id }) => [{ type: 'workfile', id }],
    }),
  }),
})

export const { useGetWorkfileListQuery, useGetWorkfileByIdQuery } = getWorkfiles
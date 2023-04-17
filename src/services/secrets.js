import { ayonApi } from './ayon'

const secrets = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getSecrets: build.query({
      query: () => ({
        url: `/api/secrets`,
        method: 'GET',
      }),

      providesTags: ['secrets'],
      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }),

    setSecret: build.mutation({
      query: ({ name, value }) => ({
        url: `/api/secrets/${name}`,
        method: 'PUT',
        body: { value },
      }),
      invalidatesTags: ['secrets'],

      async onQueryStarted({ name, value }, { dispatch, queryFulfilled }) {
        const putResult = dispatch(
          ayonApi.util.updateQueryData('getSecrets', {}, (draft) => {
            Object.assign(draft, { [name]: value })
          }),
        )
        try {
          await queryFulfilled
        } catch {
          putResult.undo()
        }
      }, // onQueryStarted
    }), // setSecret

    deleteSecret: build.mutation({
      query: ({ name }) => ({
        url: `/api/secrets/${name}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['secrets'],
    }), // deleteSecret
  }), //endpoints
})

export const { useGetSecretsQuery, useSetSecretMutation, useDeleteSecretMutation } = secrets

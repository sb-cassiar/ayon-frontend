import { ayonApi } from '../ayon'
import PubSub from '/src/pubsub'

const EVENT_FRAGMENT = `
fragment EventFragment on EventNode {
  id
  topic
  user
  sender
  project
  description
  dependsOn
  updatedAt
  status
}
`

const EVENTS_QUERY = `
query Events($last: Int, $includeLogs: Boolean) {
    events(last: $last, includeLogs: $includeLogs) {
      edges {
        node {
          ...EventFragment
        }
      }
    }
  }
  ${EVENT_FRAGMENT}
`

const EVENTS_LOGS_QUERY = `
query EventsWithLogs($last: Int, $before: String, $beforeLogs: String) {
  events(last: $last, before: $before, includeLogs: false) {
    edges {
      node {
        ...EventFragment
      }
      cursor
    }
    pageInfo {
      hasPreviousPage
    }
  }
  logs: events(last: $last, before: $beforeLogs, includeLogs: true) {
    edges {
      node {
        ...EventFragment
      }
      cursor
    }
    pageInfo {
      hasPreviousPage
    }
  }
}
${EVENT_FRAGMENT}
`

const EVENTS_BY_TOPICS_QUERY = `
query EventsByTopics($topics: [String!]!, $last: Int, $projects: [String!]!) {
  events(topics: $topics, last: $last, projects: $projects) {
    edges {
      node {
        ...EventFragment
      }
    }
  }
}
${EVENT_FRAGMENT}
`

const transformEvents = (events) =>
  events?.edges?.map((edge) => ({
    id: edge.node.id,
    topic: edge.node.topic,
    user: edge.node.user,
    sender: edge.node.sender,
    dependsOn: edge.node.dependsOn,
    project: edge.node.project,
    description: edge.node.description,
    updatedAt: edge.node.updatedAt,
    status: edge.node.status,
    entityId: edge.node.summary?.entityId,
    cursor: edge.cursor,
  }))

const patchNewEvents = (type, events, draft) => {
  draft[type] = [...events, ...draft[type]]
}

const getEvents = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getEvents: build.query({
      query: ({ last = 100, includeLogs = true }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: EVENTS_QUERY,
          variables: { last, includeLogs },
        },
      }),
      transformResponse: (response) => transformEvents(response?.data?.events),
    }),
    getEventsWithLogs: build.query({
      query: ({ last = 100, before = '', beforeLogs = '' }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: EVENTS_LOGS_QUERY,
          variables: { last, before, beforeLogs },
        },
      }),
      transformResponse: (response) => ({
        events: transformEvents(response?.data?.events),
        logs: transformEvents(response?.data?.logs),
        hasPreviousPage: response?.data?.events?.pageInfo?.hasPreviousPage,
      }),
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        let token
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = (topic, message) => {
            if (topic === 'client.connected') {
              return
            }

            updateCachedData((draft) => {
              console.log('new ws')
              if (!topic.startsWith('log.')) {
                // patch only non log messages
                patchNewEvents('events', [message], draft)
              }

              // patch all into logs
              patchNewEvents('logs', [message], draft)
            })
          }

          // sub to websocket topic
          token = PubSub.subscribe('*', handlePubSub)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        PubSub.unsubscribe(token)
      },
    }),
    getEventById: build.query({
      query: ({ id }) => ({
        url: `/api/events/${id}`,
      }),
    }),
    getEventsByTopic: build.query({
      query: ({ topics, projects, last = 10 }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: EVENTS_BY_TOPICS_QUERY,
          variables: { topics, projects, last },
        },
      }),
      transformResponse: (response) => transformEvents(response?.data?.events),
    }),
  }),
})

export const {
  useGetEventsQuery,
  useGetEventsWithLogsQuery,
  useLazyGetEventsWithLogsQuery,
  useGetEventByIdQuery,
  useGetEventsByTopicQuery,
} = getEvents

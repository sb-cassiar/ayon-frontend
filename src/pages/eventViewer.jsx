import { useState, useEffect } from 'react'
import axios from 'axios'
import { DateTime } from 'luxon'

import { Dialog } from 'primereact/dialog'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TableWrapper } from '/src/components'

const EVENTS_QUERY = `
query Events {
    events(last: 100) {
      edges {
        node {
          id
          topic
          user
          sender
          project
          description
          dependsOn
          updatedAt
        }
      }
    }
}
`

const EventDetailDialog = ({ eventId, onHide }) => {
  const [eventData, setEventData] = useState(null)

  useEffect(() => {
    if (!eventId) {
      onHide()
      return
    }

    axios.get(`/api/events/${eventId}`).then((response) => {
      setEventData(response.data)
    })
  }, [eventId])

  return (
    <Dialog onHide={onHide} visible={true}>
      <pre>{JSON.stringify(eventData, null, 2)}</pre>
    </Dialog>
  )
}

const EventViewer = () => {
  const [eventData, setEventData] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [detailVisible, setDetailVisible] = useState(false)

  const loadEventData = () => {
    axios
      .post('/graphql', {
        query: EVENTS_QUERY,
        variables: {},
      })
      .then((response) => {
        if (!response.data?.data?.events) return

        let result = []
        for (const edge of response.data.data.events.edges) {
          result.push({
            id: edge.node.id,
            topic: edge.node.topic,
            user: edge.node.user,
            sender: edge.node.sender,
            dependsOn: edge.node.dependsOn,
            project: edge.node.project,
            description: edge.node.description,
            updatedAt: edge.node.updatedAt,
          })
        }
        setEventData(result)
      })
  }

  const handlePubSub = (topic, message) => {
    if (topic === 'client.reconnected') {
      loadEventData()
      return
    }
    setEventData((ed) => {
      let updated = false
      for (const row of ed){
        if (row.id !== message.id)
          continue
        updated = true
        Object.assign(row, message)
        return ed
      }
      if (!updated)
        return [message, ...ed]

    })
  }

  useEffect(() => {
    const token = PubSub.subscribe('*', handlePubSub)
    return () => PubSub.unsubscribe(token)
  }, [])

  useEffect(() => {
    loadEventData()
    // eslint-disable-next-line
  }, [])

  const formatTime = (rowData) => {
    return DateTime.fromSeconds(rowData.updatedAt).toRelative()
  }

  const onRowClick = (e) => {
    if (e.originalEvent.detail === 2) {
      setDetailVisible(true)
    }
  }

  return (
    <main>
      <section style={{ flexGrow: 1 }}>
        {detailVisible && (
          <EventDetailDialog
            onHide={() => setDetailVisible(false)}
            eventId={selectedEvent?.id}
          />
        )}
        <TableWrapper>
          <DataTable
            value={eventData}
            scrollable="true"
            scrollHeight="flex"
            responsive="true"
            dataKey="id"
            selectionMode="single"
            onSelectionChange={(e) => setSelectedEvent(e.value)}
            selection={selectedEvent}
            onRowClick={onRowClick}
            rowClassName={(rowData) => {
              return { italic: selectedEvent && selectedEvent.id === rowData.dependsOn }
            }}
          >
            <Column header="Time" body={formatTime} style={{ maxWidth: 200 }} />
            <Column header="Id" field="id" style={{ maxWidth: 300 }} />
            <Column header="Topic" field="topic" style={{ maxWidth: 120 }} />
            <Column header="User" field="user" style={{ maxWidth: 120 }} />
            <Column header="Sender" field="sender" style={{ maxWidth: 300 }} />
            <Column header="Project" field="project" style={{ maxWidth: 150 }} />
            <Column header="Description" field="description" />
          </DataTable>
        </TableWrapper>
      </section>
    </main>
  )
}

export default EventViewer

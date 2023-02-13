import React from 'react'
import { useMemo } from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import ListStatsTile from './ListStatsTile'
import copyToClipboard from '/src/helpers/copyToClipboard'
import { useGetProjectDashboardQuery } from '/src/services/getProjectDashboard'

const ProjectStats = ({ projectName, share, index }) => {
  const [counters, setCounters] = useState({})
  const [isCounting, setIsCounting] = useState(true)

  const {
    data = {},
    isLoading,
    isError,
  } = useGetProjectDashboardQuery({ projectName, panel: 'entities' })

  const { folders, subsets, tasks, versions, representations, workfiles } = data

  useEffect(() => {
    // when data loaded use a setInterval to count up to the actual number
    const intervals = 100
    let count = 0
    let interval
    if (!isLoading) {
      let tempCounters = {
        folders: 0,
        subsets: 0,
        tasks: 0,
        versions: 0,
        representations: 0,
        workfiles: 0,
      }
      setIsCounting(true)

      interval = setInterval(() => {
        count++

        tempCounters = {
          folders: Math.round((folders / intervals) * count),
          subsets: Math.round((subsets / intervals) * count),
          tasks: Math.round((tasks / intervals) * count),
          versions: Math.round((versions / intervals) * count),
          representations: Math.round((representations / intervals) * count),
          workfiles: Math.round((workfiles / intervals) * count),
        }

        setCounters(tempCounters)
        if (count === intervals) {
          setIsCounting(false)
          clearInterval(interval)
        }
      }, 5)
    }

    //   clear
    return () => {
      clearInterval(interval)
    }
  }, [isLoading, data])

  // convert above to object
  const stats = {
    folders: { label: 'Folders', icon: 'folder', stat: folders },
    subsets: { label: 'Subsets', icon: 'inventory_2', stat: subsets },
    versions: { label: 'Versions', icon: 'layers', stat: versions },
    representations: { label: 'Representations', icon: 'view_in_ar', stat: representations },
    tasks: { label: 'Tasks', icon: 'check_circle', stat: tasks },
    workfiles: { label: 'Workfiles', icon: 'home_repair_service', stat: workfiles },
  }

  const statsOrder = ['folders', 'subsets', 'versions', 'representations', 'tasks', 'workfiles']

  const copyStatMessage = (id) => {
    const { label, stat } = stats[id]
    // demo_Commercial has 10 folders
    const message = `${projectName} has ${stat} ${label}`
    copyToClipboard(message)
  }

  const shareData = useMemo(() => {
    return { project: projectName, ...data }
  }, [isCounting])

  return (
    <DashboardPanelWrapper
      title="Project Stats"
      isError={isError}
      icon={{ icon: 'share', onClick: () => share('stats', shareData, index) }}
    >
      {statsOrder.map((id) => {
        const { label, icon } = stats[id]

        return (
          <ListStatsTile
            title={label}
            stat={counters[id] || stats[id].stat}
            icon={icon}
            isLoading={isLoading}
            key={id}
            onClick={() => copyStatMessage(id)}
          />
        )
      })}
    </DashboardPanelWrapper>
  )
}

export default ProjectStats

import React from 'react'
import { useDispatch } from 'react-redux'
import styled, { css } from 'styled-components'
import { onShare } from '/src/features/context'
import { toPng } from 'html-to-image'
import { useRef } from 'react'

// styled grid
const GridStyled = styled.div`
  display: grid;
  grid-template-columns: 1fr 0.8fr 1.2fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;

  /* overflow y */
  overflow-y: clip;
  padding-top: 1px;
  margin-top: -1px;

  /* grid rows */
  ${({ rows }) =>
    rows &&
    rows.map(
      (row, index) => css`
        & > *:nth-child(${index + 1}) {
          grid-row: span ${row};
        }
      `,
    )}
`

const GridLayout = ({ children, projectName }) => {
  const dispatch = useDispatch()
  const ref = useRef()

  const handleShareLink = async (name, data, index) => {
    // get ref of child using index
    const childRef = ref.current.children[index]

    const share = { name, data, img: null, link: window.location.href }

    let img
    if (childRef) {
      dispatch(onShare(share))
      // hide share icon
      childRef.querySelector('header button').style.display = 'none'
      img = await toPng(childRef).catch((err) => console.log(err))
      // show share icon
      childRef.querySelector('header button').style.display = 'block'
      dispatch(onShare({ ...share, img }))
    } else {
      dispatch(onShare(share))
    }
  }
  // get rows props from children
  const rows = React.Children.map(children, (child) => child.props.rows || 1)

  const childrenWithProps = React.Children.map(children, (child, index) =>
    React.cloneElement(child, { projectName, share: handleShareLink, index }),
  )

  return (
    <GridStyled rows={rows} ref={ref}>
      {childrenWithProps}
    </GridStyled>
  )
}

export default GridLayout

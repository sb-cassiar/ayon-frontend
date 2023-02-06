import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const TileStyled = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: var(--color-grey-01);
  padding: 12px 8px;
  border-radius: var(--base-input-border-radius);
  user-select: none;
  cursor: pointer;

  &:hover {
    background-color: var(--color-grey-02);
  }

  h2 {
    flex: 1;
    margin: 0;
    height: 16px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`

const ListStatsTile = ({ title, stat, icon, isLoading, onClick }) => {
  return (
    <TileStyled onClick={onClick}>
      {icon && <span className="material-symbols-outlined">{icon}</span>}
      <h2>{title}</h2>
      <span>{isLoading ? '...' : stat || 'unknown'}</span>
    </TileStyled>
  )
}

ListStatsTile.propTypes = {
  title: PropTypes.string.isRequired,
  stat: PropTypes.number,
  icon: PropTypes.string,
  isLoading: PropTypes.bool,
  onClick: PropTypes.func,
}

export default ListStatsTile

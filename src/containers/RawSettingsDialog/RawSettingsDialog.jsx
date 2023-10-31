import { useState, useEffect } from 'react'

import CodeEditor from '@uiw/react-textarea-code-editor'
import { Dialog } from 'primereact/dialog'
import { Button, SaveButton } from '@ynput/ayon-react-components'
import { toast } from 'react-toastify'

import styled from 'styled-components'

import {
  useSetRawAddonSettingsOverridesMutation,
  useLazyGetRawAddonSettingsOverridesQuery,
} from '/src/services/addonSettings'

const EditorWrapper = styled.div`
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  min-height: 800px;
  display: flex;
  flex-direction: column;

  .wrap {
    position: relative;
    top: 0;
    left: 0;
    overflow: scroll;
  }
  .w-tc-editor {
    flex-grow: 1;
    * {
      font-family: monospace !important;
      font-size: 12px;
    }
  }
`

const Warning = styled.div`
  position: absolute;
  top: 70px;
  bottom: 60px;
  left: 0;
  right: 0;
  font-size: 14px;

  z-index: 1800;
  display: flex;
  flex-direction: column;
  justify-content: center;

  padding: 40px;
  font-weight: bold;

  backdrop-filter: blur(2px);

  h1 {
    font-size: 24px;
    font-weight: bold;
    text-align: center;
  }

  p {
    text-align: center;
    font-size: 18px;
  }
`

const RawSettingsDialog = ({
  addonName,
  addonVersion,
  variant,
  siteId,
  projectName,
  reloadAddons,
  onClose,
}) => {
  const [code, setCode] = useState('{}')

  const [triggerGetSettings] = useLazyGetRawAddonSettingsOverridesQuery()
  const [saveSettings] = useSetRawAddonSettingsOverridesMutation()
  const [warn, setWarn] = useState(true)

  useEffect(() => {
    const loadNodeData = async () => {
      const overrides = await triggerGetSettings({
        addonName,
        addonVersion,
        projectName: projectName || '_',
        siteId: siteId || '_',
        variant,
      })

      setCode(JSON.stringify(overrides.data, null, 2))
    }

    loadNodeData()
  }, [addonName, addonVersion, variant])

  const onSave = async () => {
    let data = {}
    try {
      data = JSON.parse(code)
    } catch (err) {
      console.log(err)
      toast.error('Invalid JSON')
      return
    }

    const result = await saveSettings({
      addonName,
      addonVersion,
      variant,
      projectName: projectName || '_',
      siteId: siteId || '_',
      data,
    }).unwrap()

    console.log(result)

    reloadAddons([`${addonName}|${addonVersion}|${variant}|${siteId || '_'}|${projectName || '_'}`])
  }

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
      <Button
        label="Copy"
        icon="content_copy"
        onClick={() => {
          navigator.clipboard.writeText(code)
          toast.success('Copied to clipboard')
        }}
      />
      <SaveButton label="Save" icon="save" active={!warn} onClick={onSave} />
    </div>
  )

  return (
    <Dialog
      header={`${addonName} ${addonVersion} ${variant} raw settings`}
      footer={footer}
      visible={true}
      style={{ width: '800px', maxWidth: '1000px' }}
      onHide={() => onClose()}
    >
      {warn && (
        <Warning onClick={() => setWarn(false)}>
          <h1>Warning</h1>
          <p>
            This interface is intended for advanced users only. Incorrect modifications can make the
            addon completely inoperable.
          </p>
          <p>
            Proceed with extreme caution and ensure you fully understand the implications of any
            changes made.
          </p>
          <p>Click here to continue</p>
        </Warning>
      )}
      <EditorWrapper>
        <CodeEditor
          wrap={false}
          value={code}
          language="json"
          placeholder="Please enter JS code."
          onChange={(evn) => setCode(evn.target.value)}
        />
      </EditorWrapper>
    </Dialog>
  )
}

export default RawSettingsDialog
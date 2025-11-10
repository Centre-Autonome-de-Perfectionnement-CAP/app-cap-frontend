import { CCard, CCardBody, CCardHeader, CCol, CFormCheck, CFormSwitch, CRow } from '@coreui/react'

const ChecksRadios = () => {
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>React Checkbox</strong>
          </CCardHeader>
          <CCardBody>
            
              <CFormCheck id="flexCheckDefault" label="Default checkbox" />
              <CFormCheck id="flexCheckChecked" label="Checked checkbox" defaultChecked />
            
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>React Checkbox</strong> <small>Disabled</small>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              Add the <code>disabled</code> attribute and the associated <code>&lt;label&gt;</code>s
              are automatically styled to match with a lighter color to help indicate the
              input&#39;s state.
            </p>
            
              <CFormCheck label="Disabled checkbox" disabled />
              <CFormCheck label="Disabled checked checkbox" defaultChecked disabled />
            
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>React Radio</strong>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              Add the <code>disabled</code> attribute and the associated <code>&lt;label&gt;</code>s
              are automatically styled to match with a lighter color to help indicate the
              input&#39;s state.
            </p>
            
              <CFormCheck
                type="radio"
                name="flexRadioDefault"
                id="flexRadioDefault1"
                label="Default radio"
              />
              <CFormCheck
                type="radio"
                name="flexRadioDefault"
                id="flexRadioDefault2"
                label="Checked radio"
                defaultChecked
              />
            
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>React Radio</strong> <small>Disabled</small>
          </CCardHeader>
          <CCardBody>
            
              <CFormCheck
                type="radio"
                name="flexRadioDisabled"
                id="flexRadioDisabled"
                label="Disabled radio"
                disabled
              />
              <CFormCheck
                type="radio"
                name="flexRadioDisabled"
                id="flexRadioCheckedDisabled"
                label="Disabled checked radio"
                defaultChecked
                disabled
              />
            
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>React Switches</strong>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              A switch has the markup of a custom checkbox but uses the <code>switch</code> boolean
              properly to render a toggle switch. Switches also support the <code>disabled</code>{' '}
              attribute.
            </p>
            
              <CFormSwitch label="Default switch checkbox input" id="formSwitchCheckDefault" />
              <CFormSwitch
                label="Checked switch checkbox input"
                id="formSwitchCheckChecked"
                defaultChecked
              />
              <CFormSwitch
                label="Disabled switch checkbox input"
                id="formSwitchCheckDisabled"
                disabled
              />
              <CFormSwitch
                label="Disabled checked switch checkbox input"
                id="formSwitchCheckCheckedDisabled"
                defaultChecked
                disabled
              />
            
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>React Switches</strong> <small>Sizes</small>
          </CCardHeader>
          <CCardBody>
            
              <CFormSwitch label="Default switch checkbox input" id="formSwitchCheckDefault" />
              <CFormSwitch
                size="lg"
                label="Large switch checkbox input"
                id="formSwitchCheckDefaultLg"
              />
              <CFormSwitch
                size="xl"
                label="Extra large switch checkbox input"
                id="formSwitchCheckDefaultXL"
              />
            
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>React Checks and Radios</strong> <small>Default layout (stacked)</small>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              By default, any number of checkboxes and radios that are immediate sibling will be
              vertically stacked and appropriately spaced.
            </p>
            
              <CFormCheck id="defaultCheck1" label="Default checkbox" />
              <CFormCheck id="defaultCheck2" label="Disabled checkbox" disabled />
            
            
              <CFormCheck
                type="radio"
                name="exampleRadios"
                id="exampleRadios1"
                value="option1"
                label="Default radio"
                defaultChecked
              />
              <CFormCheck
                type="radio"
                name="exampleRadios"
                id="exampleRadios2"
                value="option2"
                label="Second default radio"
              />
              <CFormCheck
                type="radio"
                name="exampleRadios"
                id="exampleRadios3"
                value="option3"
                label="Disabled radio"
                disabled
              />
            
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>React Checks and Radios</strong> <small>Inline</small>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              Group checkboxes or radios on the same horizontal row by adding <code>inline</code>{' '}
              boolean property to any <code>&lt;CFormCheck&gt;</code>.
            </p>
            
              <CFormCheck inline id="inlineCheckbox1" value="option1" label="1" />
              <CFormCheck inline id="inlineCheckbox2" value="option2" label="2" />
              <CFormCheck
                inline
                id="inlineCheckbox3"
                value="option3"
                label="3 (disabled)"
                disabled
              />
            
            
              <CFormCheck
                inline
                type="radio"
                name="inlineRadioOptions"
                id="inlineCheckbox1"
                value="option1"
                label="1"
              />
              <CFormCheck
                inline
                type="radio"
                name="inlineRadioOptions"
                id="inlineCheckbox2"
                value="option2"
                label="2"
              />
              <CFormCheck
                inline
                type="radio"
                name="inlineRadioOptions"
                id="inlineCheckbox3"
                value="option3"
                label="3 (disabled)"
                disabled
              />
            
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>React Checks and Radios</strong> <small>Without labels</small>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              Remember to still provide some form of accessible name for assistive technologies (for
              instance, using <code>aria-label</code>).
            </p>
            
              <div>
                <CFormCheck id="checkboxNoLabel" value="" aria-label="..." />
              </div>
              <div>
                <CFormCheck
                  type="radio"
                  name="radioNoLabel"
                  id="radioNoLabel"
                  value=""
                  aria-label="..."
                />
              </div>
            
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Toggle buttons</strong>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              Create button-like checkboxes and radio buttons by using <code>button</code> boolean
              property on the <code>&lt;CFormCheck&gt;</code> component. These toggle buttons can
              further be grouped in a button group if needed.
            </p>
            
              <CFormCheck
                button={{ color: 'primary ' }}
                id="btn-check"
                autoComplete="off"
                label="Single toggle"
              />
            
            
              <CFormCheck
                button={{ color: 'primary ' }}
                id="btn-check-2"
                autoComplete="off"
                label="Checked"
                defaultChecked
              />
            
            
              <CFormCheck
                button={{ color: 'primary ' }}
                id="btn-check-3"
                autoComplete="off"
                label="Disabled"
                disabled
              />
            
            <h3>Radio toggle buttons</h3>
            
              <CFormCheck
                button={{ color: 'secondary' }}
                type="radio"
                name="options"
                id="option1"
                autoComplete="off"
                label="Checked"
                defaultChecked
              />
              <CFormCheck
                button={{ color: 'secondary' }}
                type="radio"
                name="options"
                id="option2"
                autoComplete="off"
                label="Radio"
              />
              <CFormCheck
                button={{ color: 'secondary' }}
                type="radio"
                name="options"
                id="option3"
                autoComplete="off"
                label="Radio"
                disabled
              />
              <CFormCheck
                button={{ color: 'secondary' }}
                type="radio"
                name="options"
                id="option4"
                autoComplete="off"
                label="Radio"
              />
            
            <h3>Outlined styles</h3>
            <p className="text-body-secondary small">
              Different variants of button, such at the various outlined styles, are supported.
            </p>
            
              <div>
                <CFormCheck
                  button={{ color: 'primary', variant: 'outline' }}
                  id="btn-check-outlined"
                  autoComplete="off"
                  label="Single toggle"
                />
              </div>
              <div>
                <CFormCheck
                  button={{ color: 'secondary', variant: 'outline' }}
                  id="btn-check-2-outlined"
                  autoComplete="off"
                  label="Checked"
                  defaultChecked
                />
              </div>
              <div>
                <CFormCheck
                  button={{ color: 'success', variant: 'outline' }}
                  type="radio"
                  name="options-outlined"
                  id="success-outlined"
                  autoComplete="off"
                  label="Radio"
                  defaultChecked
                />
                <CFormCheck
                  button={{ color: 'danger', variant: 'outline' }}
                  type="radio"
                  name="options-outlined"
                  id="danger-outlined"
                  autoComplete="off"
                  label="Radio"
                />
              </div>
            
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ChecksRadios

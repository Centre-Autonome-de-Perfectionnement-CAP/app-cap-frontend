import React from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CFormLabel, CFormRange, CRow } from '@coreui/react'

const Range = () => {
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>React Range</strong> <small></small>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              Create custom <code>&lt;input type=&#34;range&#34;&gt;</code> controls with{' '}
              <code>&lt;CFormRange&gt;</code>.
            </p>
            
              <CFormLabel htmlFor="customRange1">Example range</CFormLabel>
              <CFormRange id="customRange1" />
            
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>React Range</strong> <small>Disabled</small>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              Add the <code>disabled</code> boolean attribute on an input to give it a grayed out
              appearance and remove pointer events.
            </p>
            
              <CFormLabel htmlFor="disabledRange">Disabled range</CFormLabel>
              <CFormRange id="disabledRange" disabled />
            
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>React Range</strong> <small>Min and max</small>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              Range inputs have implicit values for <code>min</code> and <code>max</code>—
              <code>0</code> and <code>100</code>, respectively. You may specify new values for
              those using the <code>min</code> and <code>max</code> attributes.
            </p>
            
              <CFormLabel htmlFor="customRange2">Example range</CFormLabel>
              <CFormRange min={0} max={5} defaultValue="3" id="customRange2" />
            
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>React Range</strong> <small>Steps</small>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              By default, range inputs &#34;snap&#34; to integer values. To change this, you can
              specify a <code>step</code> value. In the example below, we double the number of steps
              by using <code>step=&#34;0.5&#34;</code>.
            </p>
            
              <CFormLabel htmlFor="customRange3">Example range</CFormLabel>
              <CFormRange min={0} max={5} step={0.5} defaultValue="3" id="customRange3" />
            
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Range

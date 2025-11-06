import {
  CAvatar,
  CDropdown,
  CDropdownToggle,
} from '@coreui/react'

const AppHeaderDropdown = () => {
  return (
    <CDropdown variant="nav-item" placement="bottom-end">
      <CDropdownToggle className="py-0 pe-0" caret={false}>
        <CAvatar src="/public/images/cap.png" size="md" />
      </CDropdownToggle>
    </CDropdown>
  )
}

export default AppHeaderDropdown

# Example TestID Map (Clients List + Create Flow)

Use this as a baseline mapping when generating screen + E2E together.

## Clients List

- Screen root: `screen.clients.list`
- Search input: `input.clients.search`
- Add button: `button.clients.add`
- List wrapper: `list.clients`
- Row item: `item.client.<clientId>`

## New Client

- Screen root: `screen.clients.new`
- First name: `input.clients.firstName`
- Last name: `input.clients.lastName`
- Phone: `input.clients.phoneNumber`
- Gender male: `button.clients.gender.male`
- Gender female: `button.clients.gender.female`
- Birth date open: `button.clients.birthDate.open`
- Birth date picker: `input.clients.birthDate.picker`
- Save: `button.clients.save`

## Navigation Tabs

- Home tab: `tab.home`
- Clients tab: `tab.clients`
- Settings tab: `tab.settings`

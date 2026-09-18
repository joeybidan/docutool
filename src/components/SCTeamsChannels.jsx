const CHANNELS = [
  {
    label: 'General',
    url: 'https://teams.cloud.microsoft/l/channel/19%3AUi3xt3150pVgSgAUpFj1YIHiq-dPNwFBFbMfLXlXmfI1%40thread.tacv2/General?groupId=bf218a56-a9de-4bac-a68c-d6e68f1fe394&tenantId=4791286b-0707-4782-8dae-89fe4a320b09',
  },
  {
    label: 'Payer CST',
    url: 'https://teams.cloud.microsoft/l/channel/19%3A36dcd62c2c194c0f8be1568048fc967e%40thread.tacv2/Payer%20-%20CST?groupId=bf218a56-a9de-4bac-a68c-d6e68f1fe394&tenantId=4791286b-0707-4782-8dae-89fe4a320b09',
  },
  {
    label: 'Discharge Support',
    url: 'https://teams.cloud.microsoft/l/channel/19%3Apm5vwa-75Wwt4cQ2EQrKoI4UEW4j8f_mG0ueq17psz41%40thread.tacv2/Discharge%20Support%20Updates?groupId=e0a1a3ef-af9b-4d6c-ad9b-66c2e862eaaa&tenantId=4791286b-0707-4782-8dae-89fe4a320b09',
  },
  {
    label: 'Cognizant Lead Updates',
    url: 'https://teams.cloud.microsoft/l/channel/19%3ADsjBxslfj22Q7HxvswP6DSGSqeNnvG0GYr9Q_KGTJZw1%40thread.tacv2/Cognizant%20Leads%20Updates?groupId=f739c6c4-98ca-4135-987f-7c5e5ffe072a&tenantId=4791286b-0707-4782-8dae-89fe4a320b09',
  },
  {
    label: 'Payment Operations',
    url: 'https://teams.cloud.microsoft/l/channel/19%3A6752dd7bd44c4a19bcb8740f924c7ac3%40thread.tacv2/Payment%20Operations?groupId=cc8281f0-4125-4b91-865d-5ebbb5c2a173&tenantId=4791286b-0707-4782-8dae-89fe4a320b09&ngc=true',
  },
  {
    label: 'CST Recruiting',
    url: 'https://teams.cloud.microsoft/l/channel/19%3A029eb73c9ecc497a810bb4881282227d%40thread.tacv2/CST%20-%20Recruiting?groupId=cc8281f0-4125-4b91-865d-5ebbb5c2a173&tenantId=4791286b-0707-4782-8dae-89fe4a320b09',
  },
  {
    label: 'Caregiver Taxes 1099',
    url: 'https://teams.cloud.microsoft/l/channel/19%3A828f916ddc0a4146aa8a0d0e7d7d0cac%40thread.tacv2/Caregiver%20Taxes%201099?groupId=cc8281f0-4125-4b91-865d-5ebbb5c2a173&tenantId=4791286b-0707-4782-8dae-89fe4a320b09',
  },
]

function TeamsLogo() {
  return (
    <span className="teams-mini-logo" aria-hidden="true">
      <span>T</span>
      <i />
      <b />
    </span>
  )
}

function openChannelWindow(url, label) {
  const popup = window.open(
    url,
    `docutool-teams-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    'popup=yes,width=1280,height=820,resizable=yes,scrollbars=yes,noopener,noreferrer',
  )

  if (!popup) {
    window.alert('Chrome blocked the Teams window. Allow pop-ups for DocuTool, then try again.')
  }
}

export function SCTeamsChannels() {
  return (
    <section className="panel teams-channels-panel" aria-labelledby="teams-channels-title">
      <div className="panel-heading teams-channels-heading">
        <div>
          <h2 id="teams-channels-title">SC Teams Channels</h2>
          <p className="panel-subtitle">CL Payer-Shared</p>
        </div>
        <TeamsLogo />
      </div>

      <div className="teams-channel-list">
        {CHANNELS.map((channel) => (
          <button
            key={channel.label}
            type="button"
            className="teams-channel-link"
            onClick={() => openChannelWindow(channel.url, channel.label)}
            title={`Open ${channel.label} in a separate browser window`}
          >
            <TeamsLogo />
            <span>{channel.label}</span>
          </button>
        ))}
      </div>
      <p className="teams-channel-note">Links request a separate Chrome window; popup settings can override window behavior.</p>
    </section>
  )
}

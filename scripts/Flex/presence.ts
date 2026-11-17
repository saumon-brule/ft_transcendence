import { ActivityType, Assets, getTimestamps } from 'premid'

const presence = new Presence({
  clientId: '1572211662881296434',
})

enum ActivityAssets {
  // Must be a direct, publicly reachable image URL (PNG/JPG). Discord fetches it itself.
  Logo = 'https://imgur.com/oOXk8p6.png',
}

// The Flex front exposes its playback state on <html data-flex-*> (see front/src/components/context/mediaSession.ts).
function readNowPlaying() {
  const d = document.documentElement.dataset
  const position = Number(d.flexPosition)
  const duration = Number(d.flexDuration)
  return {
    title: d.flexTitle,
    artists: d.flexArtists,
    album: d.flexAlbum,
    paused: d.flexPaused !== 'false',
    position: Number.isFinite(position) ? position : null,
    duration: Number.isFinite(duration) && duration > 0 ? duration : null,
  }
}

presence.on('UpdateData', async () => {
  const [privacy, timestamps, showAlbum, showPaused] = await Promise.all([
    presence.getSetting<boolean>('privacy'),
    presence.getSetting<boolean>('timestamps'),
    presence.getSetting<boolean>('album'),
    presence.getSetting<boolean>('showPaused'),
  ])
  const np = readNowPlaying()

  if (!np.title || (np.paused && !showPaused))
    return presence.clearActivity()

  const presenceData: PresenceData = {
    type: ActivityType.Listening,
    largeImageKey: ActivityAssets.Logo,
    largeImageText: 'Flex',
    smallImageKey: np.paused ? Assets.Pause : Assets.Play,
    smallImageText: np.paused ? 'Paused' : 'Playing',
  }

  if (privacy) {
    presenceData.details = 'Listening to music'
  }
  else {
    presenceData.details = np.title
    presenceData.state = np.artists || undefined
    if (showAlbum && np.album)
      presenceData.largeImageText = np.album
  }

  if (timestamps && !np.paused && np.position !== null && np.duration !== null)
    [presenceData.startTimestamp, presenceData.endTimestamp] = getTimestamps(np.position, np.duration)

  presence.setActivity(presenceData)
})

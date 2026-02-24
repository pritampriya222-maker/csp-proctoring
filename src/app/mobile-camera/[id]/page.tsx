import MobileCameraClient from './MobileCameraClient'

export default async function MobileCameraPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
       <MobileCameraClient pairingId={id} />
    </div>
  )
}

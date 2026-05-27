export function BackgroundDecor() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute left-[8%] top-[18%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(30,64,175,0.35),transparent_70%)] blur-3xl" />
      <div className="absolute right-[10%] top-[40%] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(30,64,175,0.28),transparent_70%)] blur-3xl" />
      <div className="absolute bottom-[4%] left-[30%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.22),transparent_70%)] blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,64,175,0.18),transparent_55%)]" />
    </div>
  );
}

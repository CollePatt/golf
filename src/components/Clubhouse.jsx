import { ACHIEVEMENTS, getUnlockedAchievementCount } from '../data/achievements.js';
import { BALLS, getBallById, isBallUnlocked } from '../data/balls.js';
import { canTurnPro } from '../logic/prestigeLogic.js';
import AchievementsPanel from './AchievementsPanel.jsx';
import BallBagPanel from './BallBagPanel.jsx';
import ProPanel from './ProPanel.jsx';
import ProShopPanel from './ProShopPanel.jsx';
import SpriteIcon from './SpriteIcon.jsx';
import TeeOffPanel from './TeeOffPanel.jsx';

export default function Clubhouse({
  state,
  door,
  onOpenDoor,
  showTourOffice,
  onBackToCourse,
  onAllocate,
  onChooseCoursePerk,
  onSelectCourse,
  onStartNextRound,
  onEquipBall,
  onTurnPro,
  onBuyProUpgrade,
  onOpenGuide,
}) {
  const canSpend = state.phase === 'upgrade' && state.yardsToAllocate > 0;
  const equippedBall = getBallById(state.equippedBall);
  const hasNewBall = BALLS.some(ball => isBallUnlocked(ball.id, state) && !state.seenBallIds.includes(ball.id));
  const doors = [
    {
      id: 'shop',
      label: 'Pro Shop',
      blurb: 'Upgrades',
      badge: canSpend ? 'Spend' : null,
    },
    {
      id: 'locker',
      label: 'Locker',
      blurb: `Ball bag · ${equippedBall.label}`,
      badge: hasNewBall ? 'New' : null,
      icon: <SpriteIcon sheet="balls" tag={equippedBall.id} scale={3} />,
    },
    {
      id: 'trophies',
      label: 'Trophies',
      blurb: `${getUnlockedAchievementCount(state.achievements)} / ${ACHIEVEMENTS.length} earned`,
    },
    showTourOffice && {
      id: 'tour',
      label: 'Tour Office',
      blurb: `Pro Points · ${state.prestige.points}`,
      badge: canTurnPro(state) ? 'Ready' : null,
    },
  ].filter(Boolean);
  const openDoor = doors.some(entry => entry.id === door) ? door : 'shop';

  return (
    <div className="clubhouse">
      <TeeOffPanel
        state={state}
        onSelectCourse={onSelectCourse}
        onChooseCoursePerk={onChooseCoursePerk}
        onStartNextRound={onStartNextRound}
        onBackToCourse={onBackToCourse}
      />

      <nav className="doors" aria-label="Clubhouse">
        {doors.map(entry => (
          <button
            key={entry.id}
            type="button"
            className={`panel door ${openDoor === entry.id ? 'open' : ''}`}
            aria-pressed={openDoor === entry.id}
            onClick={() => onOpenDoor(entry.id)}
          >
            <span className="awning" aria-hidden="true" />
            {entry.badge && <span className="badge">{entry.badge}</span>}
            <strong>{entry.label}</strong>
            <span className="door-blurb">{entry.icon}{entry.blurb}</span>
          </button>
        ))}
        <button type="button" className="panel door guide-door" onClick={onOpenGuide}>
          <span className="awning" aria-hidden="true" />
          <strong>?</strong>
          <span className="door-blurb">How to play</span>
        </button>
      </nav>

      <section key={openDoor} className="panel door-view pop-in">
        {openDoor === 'shop' && <ProShopPanel state={state} onAllocate={onAllocate} />}
        {openDoor === 'locker' && <BallBagPanel state={state} onEquipBall={onEquipBall} />}
        {openDoor === 'trophies' && <AchievementsPanel state={state} />}
        {openDoor === 'tour' && (
          <ProPanel state={state} onTurnPro={onTurnPro} onBuyProUpgrade={onBuyProUpgrade} />
        )}
      </section>
    </div>
  );
}

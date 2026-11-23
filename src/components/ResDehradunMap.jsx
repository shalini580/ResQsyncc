import { RES_DEHRADUN_PLACES, resZoneLabel } from '../resApi.jsx';

const RES_ROADS = [
  { name: 'Chakrata Road', d: 'M 45 268 C 190 260, 320 245, 475 260' },
  { name: 'Rajpur Road', d: 'M 475 260 C 535 218, 585 150, 690 55' },
  { name: 'Saharanpur Road', d: 'M 470 275 C 355 335, 250 397, 88 450' },
  { name: 'Prem Nagar Road', d: 'M 70 154 C 120 185, 165 220, 220 280' },
];

const RES_ZONE_ANCHORS = {
  'Zone A': [465, 255],
  'Zone B': [205, 385],
  'Zone C': [185, 240],
  'Zone D': [625, 110],
};

function resPlaceClass(resPlace) {
  return resPlace.kind.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '');
}

export function ResDehradunArtwork({ compact = false, selectedId, onSelect, caseCounts = {} }) {
  return (
    <svg
      className={compact ? 'dehradun-mini-map' : 'dehradun-full-map'}
      viewBox="0 0 760 480"
      role="img"
      aria-label="Schematic Dehradun demo map with Paltan Bazaar, NGOs, Graphic Era, a school, hospital and city landmarks"
    >
      <rect x="0" y="0" width="760" height="480" rx="16" className="dehradun-map-bg" />
      <path d="M 48 95 C 150 30, 330 45, 455 76 C 590 109, 696 177, 716 291 C 735 397, 627 450, 494 455 C 345 460, 204 437, 94 376 C 23 336, 15 201, 48 95 Z" className="dehradun-city-outline" />
      {RES_ROADS.map((resRoad) => (
        <g key={resRoad.name}>
          <path d={resRoad.d} className="dehradun-road" />
          <path d={resRoad.d} className="dehradun-road-center" />
        </g>
      ))}
      {!compact && RES_ROADS.map((resRoad, resI) => {
        const resRoadLabels = [
          [222, 252],
          [574, 166],
          [298, 372],
          [130, 203],
        ];
        const [resX, resY] = resRoadLabels[resI];
        return <text key={`${resRoad.name}-label`} x={resX} y={resY} className="dehradun-road-label">{resRoad.name}</text>;
      })}
      <text x="28" y="28" className="dehradun-map-note">DEMO MAP · NOT TO SCALE</text>
      <text x="705" y="34" className="dehradun-north">N ↑</text>
      {RES_DEHRADUN_PLACES.map((resPlace) => {
        const resSelected = selectedId === resPlace.id;
        const resClass = resPlaceClass(resPlace);
        return (
          <g
            key={resPlace.id}
            className={`dehradun-place${resSelected ? ' is-selected' : ''}`}
            onClick={onSelect ? () => onSelect(resPlace) : undefined}
            onKeyDown={onSelect ? (resE) => resE.key === 'Enter' && onSelect(resPlace) : undefined}
            tabIndex={onSelect ? 0 : undefined}
            role={onSelect ? 'button' : undefined}
            aria-label={`${resPlace.name}, ${resPlace.kind}, ${resZoneLabel(resPlace.zone)}`}
          >
            {resSelected && <circle cx={resPlace.x} cy={resPlace.y} r="15" className="dehradun-place-halo" />}
            <circle cx={resPlace.x} cy={resPlace.y} r={compact ? 7 : 9} className={`dehradun-place-dot poi-${resClass}`} />
            {!compact && (
              <text
                x={resPlace.x + resPlace.dx}
                y={resPlace.y + resPlace.dy}
                textAnchor={resPlace.anchor || 'start'}
                className="dehradun-place-label"
              >
                {resPlace.shortName || resPlace.name}
              </text>
            )}
          </g>
        );
      })}
      {!compact && Object.entries(caseCounts).map(([resZone, resCount]) => {
        if (!resCount) return null;
        const [resX, resY] = RES_ZONE_ANCHORS[resZone] || [380, 240];
        return (
          <g key={resZone} className="dehradun-case-count" aria-label={`${resCount} open cases in ${resZoneLabel(resZone)}`}>
            <circle cx={resX} cy={resY} r="15" />
            <text x={resX} y={resY + 4}>{resCount}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function ResDehradunMini({ onOpen }) {
  return (
    <section className="dehradun-widget" aria-label="Dehradun demo map">
      <div className="dehradun-widget-head">
        <div>
          <span className="dehradun-eyebrow">RESQSYNC CITY · DEHRADUN</span>
          <h2>City demo map</h2>
        </div>
        {onOpen && <button className="btn small-btn" type="button" onClick={onOpen}>Open full map</button>}
      </div>
      <div className="dehradun-widget-body">
        <ResDehradunArtwork compact />
        <ul className="landmark-list">
          {RES_DEHRADUN_PLACES.map((resPlace) => (
            <li key={resPlace.id} className={`landmark-item poi-${resPlaceClass(resPlace)}`}>
              <span className="landmark-dot" aria-hidden="true" />
          <span>{resPlace.name}<small>{resPlace.kind} · {resZoneLabel(resPlace.zone)}</small></span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

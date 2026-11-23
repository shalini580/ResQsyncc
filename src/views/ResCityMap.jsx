import { useState } from 'react';
import { resUseLive, RES_DEHRADUN_PLACES, RES_ZONES, RES_LABEL, resQtyText, resZoneLabel } from '../resApi.jsx';
import { ResPage } from '../components/ResShared.jsx';
import { ResDehradunArtwork } from '../components/ResDehradunMap.jsx';

function resPlaceClass(resPlace) {
  return resPlace.kind.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '');
}

export default function ResCityMap() {
  const { resData: resQueue } = resUseLive('/queue', ['queue']);
  const { resData: resStock } = resUseLive('/resources', ['stock']);
  const [resPicked, resSetPicked] = useState(null);
  const resCaseCounts = Object.fromEntries(RES_ZONES.map((resZone) => [
    resZone,
    (resQueue || []).filter((resQ) => resQ.zone === resZone).length,
  ]));
  const resAreaCases = resPicked ? (resQueue || []).filter((resQ) => resQ.zone === resPicked.zone) : [];
  const resAreaStock = resPicked ? (resStock || []).filter((resS) => resS.zone === resPicked.zone) : [];

  return (
    <ResPage
      title="Dehradun demo map"
      intro="A schematic view of familiar Dehradun places. Select a marker to see its area, open cases and available supplies. The layout is illustrative, not to scale."
    >
      <div className="map-wrap dehradun-map-page">
        <ResDehradunArtwork selectedId={resPicked?.id} onSelect={resSetPicked} caseCounts={resCaseCounts} />
        <aside className="panel map-side">
          {!resPicked ? (
            <>
              <span className="dehradun-eyebrow">DEHRADUN, UTTARAKHAND</span>
              <h2>City locations</h2>
              <p className="muted small">Paltan Bazaar, Graphic Era, sample NGO locations, a school, hospital and other city landmarks are marked on the map.</p>
              <h3>Dehradun service areas</h3>
              <div className="map-area-chips">
                {RES_ZONES.map((resZone) => <span key={resZone}>{resZoneLabel(resZone)}</span>)}
              </div>
              <div className="map-stat-row">
                <strong>{RES_DEHRADUN_PLACES.length}</strong>
                <span>demo places</span>
                <strong>{resQueue?.length ?? '–'}</strong>
                <span>open cases / requests</span>
              </div>
              <ul className="map-category-list">
                {['market', 'ngo-shelter', 'campus', 'school', 'hospital', 'transit', 'landmark'].map((resKind) => (
                  <li key={resKind} className={`poi-${resKind}`}>
                    <span className="landmark-dot" aria-hidden="true" />
                    {resKind.replace('-', ' / ')}
                  </li>
                ))}
              </ul>
              <p className="muted small">Red markers show open work by service area. NGO markers are sample/demo entries.</p>
            </>
          ) : (
            <>
              <span className="dehradun-eyebrow">{resPicked.kind.toUpperCase()}</span>
              <h2>{resPicked.name}</h2>
              <p className="muted small">{resZoneLabel(resPicked.zone)} · Dehradun</p>
              <div className="map-stat-row">
                <strong>{resAreaCases.length}</strong>
                <span>open cases / requests</span>
              </div>
              <h3>Available supplies</h3>
              <ul className="plain">
                {resAreaStock.filter((resS) => ['food', 'water', 'medicine'].includes(resS.resource_type)).map((resS) => (
                  <li key={resS.resource_type}>
                    <span>{RES_LABEL[resS.resource_type]}</span>
                    <span className="num">{resS.available}</span>
                  </li>
                ))}
              </ul>
              <h3>Open work nearby</h3>
              {!resAreaCases.length ? <p className="muted small">No open cases or requests in this service area.</p> : (
                <ul className="map-case-list">
                  {resAreaCases.slice(0, 4).map((resQ) => (
                    <li key={`${resQ.kind}:${resQ.id}`}>
                      <strong>{resQ.process_id}</strong> {resQ.title}
                      <span>{resQtyText(resQ) || 'Supplies allocated'}</span>
                    </li>
                  ))}
                </ul>
              )}
              <button className="link-btn dark" type="button" onClick={() => resSetPicked(null)}>Show all Dehradun places</button>
            </>
          )}
        </aside>
      </div>
      <ul className="landmark-list map-landmark-list">
        {RES_DEHRADUN_PLACES.map((resPlace) => (
          <li key={resPlace.id} className={`landmark-item poi-${resPlaceClass(resPlace)}`}>
            <span className="landmark-dot" aria-hidden="true" />
            <span>{resPlace.name}<small>{resPlace.kind} · {resZoneLabel(resPlace.zone)}</small></span>
          </li>
        ))}
      </ul>
    </ResPage>
  );
}

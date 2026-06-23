import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { api } from "../../api";

/**
 * Wide banner for one-time add-ons (currently the bring-your-own-API-key
 * purchase). In billing mode, pass `onBuy` to drive the in-app action;
 * otherwise the CTA sends visitors to sign up.
 */
export default function AddonBanner({ onBuy, ctaLabel }) {
  const [addon, setAddon] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getAddons()
      .then((addons) => setAddon(addons.find((a) => a.id === "byo_api_key") || addons[0] || null))
      .catch(() => setAddon(null));
  }, []);

  if (!addon) return null;

  const handleClick = () => (onBuy ? onBuy() : navigate("/app"));

  return (
    <div className="mkt-addon">
      <div className="mkt-addon-inner">
        <div className="mkt-addon-icon">
          <KeyRound size={24} strokeWidth={2} />
        </div>
        <div className="mkt-addon-text">
          <span className="pill">One-time add-on</span>
          <h3>{addon.name}</h3>
          <p>{addon.tagline}</p>
        </div>
        <div className="mkt-addon-buy">
          <div className="price">${addon.one_time_price}</div>
          <div className="once">one-time</div>
          <button className="mkt-btn" onClick={handleClick}>
            {ctaLabel || "Get the add-on"}
          </button>
        </div>
      </div>
    </div>
  );
}

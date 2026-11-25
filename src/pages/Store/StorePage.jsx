import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Package, Music, Ticket, Snowflake, Check, Eye, X
} from 'lucide-react';
import Button from '../../components/Button.jsx';
import Avatar from '../../components/Avatar.jsx';
import VinylArt from '../../components/VinylArt.jsx';
import { StoreSkeleton } from '../../components/Skeletons.jsx';
import ItemRarityBadge, { RARITY_META } from '../../components/ItemRarityBadge.jsx';
import CrateOpeningModal, { CrateChestIcon } from '../../components/CrateOpeningModal.jsx';
import ApiClient from '../../services/api.js';
import soundFx from '../../services/soundFx.js';
import haptics from '../../services/haptics.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useLanguage } from '../../hooks/useLanguage.jsx';

export function StorePage() {
  const { user, refreshUser } = useAuth();
  const { lang, tx } = useLanguage();
  const [activeTab, setActiveTab] = useState('STORE'); // 'STORE' | 'GACHA' | 'LOCKER'
  const [storeFilter, setStoreFilter] = useState('ALL'); // 'ALL' | 'FRAME' | 'VINYL' | 'TITLE'
  const [lockerFilter, setLockerFilter] = useState('ALL'); // 'ALL' | 'FRAME' | 'VINYL' | 'TITLE'
  const [catalog, setCatalog] = useState([]);
  const [utilities, setUtilities] = useState([]);
  const [wallet, setWallet] = useState({ notesBalance: 0, gachaTickets: 0, streakFreezes: 0 });
  const [gachaInfo, setGachaInfo] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [useTicketForGacha, setUseTicketForGacha] = useState(false);
  const [crateModal, setCrateModal] = useState(null);
  const [poolModalCrate, setPoolModalCrate] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [catRes, gachaRes, invRes] = await Promise.all([
        ApiClient.get('/store/catalog'),
        ApiClient.get('/gacha/info'),
        user?.id ? ApiClient.get('/store/inventory').catch(() => ({ items: [] })) : Promise.resolve({ items: [] })
      ]);
      setCatalog(catRes.items || []);
      setUtilities(catRes.utilities || []);
      setWallet(catRes.wallet || { notesBalance: 0, gachaTickets: 0, streakFreezes: 0 });
      setGachaInfo(gachaRes);
      setInventory(invRes.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const showToast = (msg) => {
    setError(null);
    setMessage(msg);
    setTimeout(() => setMessage(null), 3500);
  };

  const handleBuyItem = async (item) => {
    if (!user?.id) {
      window.dispatchEvent(new CustomEvent('spotinize:open-guest-upgrade'));
      return;
    }
    try {
      setBusyId(item.id);
      setError(null);
      await ApiClient.post('/store/buy', { itemId: item.id });
      soundFx.playReward();
      haptics.reward();
      showToast(tx(`Purchased ${item.name}!`, `Berhasil membeli ${item.name}!`));
      await Promise.all([loadAll(true), refreshUser?.()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleBuyUtility = async (code) => {
    if (!user?.id) {
      window.dispatchEvent(new CustomEvent('spotinize:open-guest-upgrade'));
      return;
    }
    try {
      setBusyId(code);
      setError(null);
      if (code === 'streak_freeze') {
        await ApiClient.post('/store/buy-freeze');
        soundFx.playReward();
        haptics.reward();
        showToast(tx('Streak Freeze added!', 'Streak Freeze berhasil dibeli!'));
      } else {
        await ApiClient.post('/store/buy-ticket', { quantity: 1 });
        soundFx.playReward();
        haptics.reward();
        showToast(tx('1 Gacha Ticket added!', '1 Gacha Ticket berhasil dibeli!'));
      }
      await Promise.all([loadAll(true), refreshUser?.()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleGachaPull = async (count, crateId = 'crate_groove') => {
    if (!user?.id) {
      window.dispatchEvent(new CustomEvent('spotinize:open-guest-upgrade'));
      return;
    }
    const crate = (gachaInfo?.crates || []).find(c => c.id === crateId);
    try {
      setBusyId(`${crateId}_${count}`);
      setError(null);
      setCrateModal({ pullCount: count, crateId, cratePrices: crate?.prices, loading: true, data: null });
      const res = await ApiClient.post('/gacha/pull', { count, useTicket: useTicketForGacha, crateId });
      setCrateModal({ pullCount: count, crateId, cratePrices: crate?.prices, loading: false, data: res });
      await Promise.all([loadAll(true), refreshUser?.()]);
    } catch (err) {
      setCrateModal(null);
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleEquip = async (item) => {
    try {
      setBusyId(item.id);
      setError(null);
      if (item.isEquipped) {
        await ApiClient.post('/store/unequip', { type: item.type });
        showToast(tx(`Unequipped ${item.name}`, `${item.name} dilepas`));
      } else {
        await ApiClient.post('/store/equip', { itemId: item.id });
        showToast(tx(`Equipped ${item.name}!`, `${item.name} dipasang!`));
      }
      await Promise.all([loadAll(true), refreshUser?.()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const renderItemPreview = (item, sizePx = 52) => {
    if (item.type === 'FRAME') {
      return (
        <Avatar
          src={user?.avatarUrl}
          alt={user?.displayName}
          seed={user?.id || user?.username}
          frame={item}
          style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
        />
      );
    }
    if (item.type === 'VINYL') {
      return <VinylArt size={sizePx} borderRadius="50%" skin={item} forceDisc />;
    }
    return (
      <span
        style={{
          fontSize: '0.76rem',
          fontWeight: 700,
          padding: '5px 12px',
          borderRadius: '999px',
          color: '#e5e7eb',
          backgroundColor: '#181820',
          border: '1px solid rgba(255,255,255,0.1)',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {item.name}
      </span>
    );
  };

  const getTypeLabel = (type) => {
    if (type === 'FRAME') return 'Frame';
    if (type === 'VINYL') return 'Vinyl';
    return 'Title';
  };

  const renderFilterPills = (activeVal, onChange) => (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {[
        { id: 'ALL', label: tx('All', 'Semua') },
        { id: 'FRAME', label: 'Frames' },
        { id: 'VINYL', label: 'Vinyls' },
        { id: 'TITLE', label: 'Titles' }
      ].map(f => {
        const isActive = activeVal === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            style={{
              padding: '5px 11px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: isActive ? '1px solid rgba(29,185,84,0.45)' : '1px solid rgba(255,255,255,0.08)',
              backgroundColor: isActive ? 'rgba(29,185,84,0.14)' : '#121218',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );

  const filteredCatalog = storeFilter === 'ALL'
    ? catalog
    : catalog.filter(i => i.type === storeFilter);

  const filteredInventory = lockerFilter === 'ALL'
    ? inventory
    : inventory.filter(i => i.type === lockerFilter);

  const pityEpic = gachaInfo?.userState?.pityEpic || 0;
  const pityLegendary = gachaInfo?.userState?.pityLegendary || 0;

  return (
    <div className="home-column-wrap mobile-page-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header & Unified Wallet */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
              Store &amp; Gacha
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>
              {tx('Frames, vinyl skins, titles, crates & utilities.', 'Frame, skin vinyl, title, crate & utilitas.')}
            </p>
          </div>

          <div className="mobile-only-block">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 6px',
                borderRadius: '999px',
                backgroundColor: '#121218',
                border: '1px solid rgba(255,255,255,0.08)',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 9px', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.8rem', color: '#e5e7eb' }}>
                <Music size={13} color="var(--color-primary)" />
                <span>{wallet.notesBalance}</span>
              </div>
              <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 9px', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.8rem', color: '#e5e7eb' }}>
                <Ticket size={13} color="#38bdf8" />
                <span>{wallet.gachaTickets}</span>
              </div>
              <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 9px', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.8rem', color: '#e5e7eb' }}>
                <Snowflake size={13} color="#60a5fa" />
                <span>{wallet.streakFreezes}/2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation Segmented Pill */}
        <div className="segmented-pill" style={{ alignSelf: 'flex-start' }}>
          <button
            type="button"
            className={`segmented-pill-btn ${activeTab === 'STORE' ? 'active' : ''}`}
            onClick={() => setActiveTab('STORE')}
          >
            <ShoppingBag size={14} />
            <span>Store</span>
          </button>
          <button
            type="button"
            className={`segmented-pill-btn ${activeTab === 'GACHA' ? 'active' : ''}`}
            onClick={() => setActiveTab('GACHA')}
          >
            <CrateChestIcon size={14} />
            <span>Crate Gacha</span>
          </button>
          <button
            type="button"
            className={`segmented-pill-btn ${activeTab === 'LOCKER' ? 'active' : ''}`}
            onClick={() => setActiveTab('LOCKER')}
          >
            <Package size={14} />
            <span>Locker</span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: activeTab === 'LOCKER' ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.08)'
              }}
            >
              {inventory.length}
            </span>
          </button>
        </div>

        {message && (
          <div style={{ padding: '10px 14px', borderRadius: '12px', backgroundColor: 'rgba(29,185,84,0.12)', border: '1px solid rgba(29,185,84,0.45)', fontSize: '0.84rem', fontWeight: 700, color: '#d1fae5' }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', fontSize: '0.84rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <StoreSkeleton />
        ) : activeTab === 'STORE' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Essentials / Utilities */}
            {utilities.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>
                  {tx('Essentials', 'Utilitas')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                  {utilities.map(u => {
                    const isFreeze = u.code === 'streak_freeze';
                    const isMaxed = Boolean(u.maxQuantity && u.currentQuantity >= u.maxQuantity);
                    return (
                      <div
                        key={u.code}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '14px',
                          backgroundColor: '#131319',
                          border: '1px solid rgba(255,255,255,0.07)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              backgroundColor: '#1b1b24',
                              border: '1px solid rgba(255,255,255,0.06)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {isFreeze ? <Snowflake size={18} color="#94a3b8" /> : <Ticket size={18} color="#94a3b8" />}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f3f4f6' }}>{u.name}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.82rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Music size={12} /> {u.priceNotes}
                          </span>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={busyId === u.code || isMaxed}
                            onClick={() => handleBuyUtility(u.code)}
                          >
                            {isMaxed ? tx('Maxed', 'Penuh') : tx('Buy', 'Beli')}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cosmetics Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>
                  {tx('Cosmetics Catalog', 'Katalog Kosmetik')}
                </div>
                {renderFilterPills(storeFilter, setStoreFilter)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {filteredCatalog.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      backgroundColor: '#131319',
                      border: '1px solid rgba(255,255,255,0.07)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    {/* Studio Stage Preview */}
                    <div
                      style={{
                        position: 'relative',
                        height: '84px',
                        borderRadius: '10px',
                        backgroundColor: '#0c0c10',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 12px'
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: '7px',
                          left: '8px',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'var(--color-text-dim)',
                          padding: '2px 7px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(255,255,255,0.05)'
                        }}
                      >
                        {getTypeLabel(item.type)}
                      </span>
                      {renderItemPreview(item)}
                    </div>

                    {/* Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f3f4f6' }}>{item.name}</div>
                      <ItemRarityBadge rarity={item.rarity} compact />
                    </div>

                    {/* Footer */}
                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: '10px',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.84rem', color: '#e5e7eb', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Music size={13} color="var(--color-primary)" /> {item.priceNotes}
                      </span>
                      {item.owned ? (
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={13} /> Owned
                        </span>
                      ) : (
                        <Button size="sm" variant="primary" disabled={busyId === item.id} onClick={() => handleBuyItem(item)}>
                          {busyId === item.id ? '...' : tx('Buy', 'Beli')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'GACHA' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Top Bar: Pity Info + Currency Switch */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: 'var(--color-text-dim)' }}>
                Pity: Epic+ {pityEpic}/10 · Leg+ {pityLegendary}/50
              </span>

              <div className="segmented-pill">
                <button
                  type="button"
                  className={`segmented-pill-btn ${!useTicketForGacha ? 'active' : ''}`}
                  onClick={() => setUseTicketForGacha(false)}
                >
                  <Music size={12} />
                  <span>Notes</span>
                </button>
                <button
                  type="button"
                  className={`segmented-pill-btn ${useTicketForGacha ? 'active' : ''}`}
                  onClick={() => setUseTicketForGacha(true)}
                >
                  <Ticket size={12} />
                  <span>Tickets ({wallet.gachaTickets})</span>
                </button>
              </div>
            </div>

            {/* 3 Horizontal Rectangular Crate Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(gachaInfo?.crates || []).map(crate => {
                const desc = lang === 'en' ? crate.descriptionEn : crate.description;
                return (
                  <div
                    key={crate.id}
                    style={{
                      position: 'relative',
                      padding: '16px',
                      borderRadius: '16px',
                      backgroundColor: '#131319',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      flexWrap: 'wrap'
                    }}
                  >
                    {/* Top-right Eye Pool Button */}
                    <button
                      type="button"
                      onClick={() => setPoolModalCrate(crate)}
                      title={tx('View featured items', 'Lihat isi crate')}
                      aria-label={tx('View featured items', 'Lihat isi crate')}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '30px',
                        height: '30px',
                        borderRadius: '10px',
                        backgroundColor: '#09090d',
                        border: '1px solid rgba(255,255,255,0.14)',
                        color: 'var(--color-text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Eye size={14} />
                    </button>

                    {/* Left: Crate Pedestal + Name & Description */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 240px', minWidth: 0, paddingRight: '42px' }}>
                      <div
                        style={{
                          position: 'relative',
                          width: '76px',
                          height: '76px',
                          borderRadius: '16px',
                          backgroundColor: '#0b0b10',
                          border: '1px solid rgba(255,255,255,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            inset: '6px',
                            borderRadius: '10px',
                            border: '1px dashed rgba(255,255,255,0.08)',
                            pointerEvents: 'none'
                          }}
                        />
                        <CrateChestIcon size={38} color="#e5e7eb" />
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 style={{ fontSize: '1.02rem', fontWeight: 900, margin: 0, color: '#f3f4f6' }}>
                          {crate.name}
                        </h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '3px', marginBottom: 0, lineHeight: 1.4 }}>
                          {desc}
                        </p>
                      </div>
                    </div>

                    {/* Right: 3 Compact Black Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginLeft: 'auto' }}>

                      {[1, 5, 10].map(cnt => (
                        <button
                          key={cnt}
                          type="button"
                          disabled={Boolean(busyId)}
                          onClick={() => handleGachaPull(cnt, crate.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            backgroundColor: '#09090d',
                            border: '1px solid rgba(255,255,255,0.14)',
                            color: '#f3f4f6',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: busyId ? 'not-allowed' : 'pointer',
                            opacity: busyId ? 0.6 : 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          {busyId === `${crate.id}_${cnt}` ? (
                            <span>...</span>
                          ) : (
                            <>
                              <span>{cnt}x</span>
                              <span style={{ color: 'rgba(255,255,255,0.28)' }}>·</span>
                              {useTicketForGacha ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontFamily: 'var(--font-mono)' }}>
                                  <Ticket size={11} color="#94a3b8" /> {cnt}
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontFamily: 'var(--font-mono)' }}>
                                  <Music size={11} color="var(--color-primary)" /> {crate.prices?.[cnt] || cnt * 200}
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* LOCKER TAB */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>
                {tx('Your Collection', 'Koleksi Kamu')} ({filteredInventory.length})
              </div>
              {renderFilterPills(lockerFilter, setLockerFilter)}
            </div>

            {filteredInventory.length === 0 ? (
              <div
                style={{
                  padding: '32px',
                  borderRadius: '14px',
                  backgroundColor: '#131319',
                  border: '1px solid rgba(255,255,255,0.07)',
                  textAlign: 'center',
                  color: 'var(--color-text-dim)',
                  fontSize: '0.86rem'
                }}
              >
                {inventory.length === 0
                  ? tx('Your Locker is empty. Claim Daily Login, shop in Store, or open Crate Gacha!', 'Locker masih kosong. Klaim Daily Login, belanja di Store, atau buka Crate Gacha!')
                  : tx('No items in this category yet.', 'Belum ada item di kategori ini.')}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '10px' }}>
                {filteredInventory.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      backgroundColor: '#131319',
                      border: item.isEquipped ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.07)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    {/* Studio Stage Preview */}
                    <div
                      style={{
                        position: 'relative',
                        height: '64px',
                        borderRadius: '8px',
                        backgroundColor: '#0c0c10',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 8px'
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: '5px',
                          left: '6px',
                          fontSize: '0.56rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'var(--color-text-dim)',
                          padding: '1px 5px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(255,255,255,0.05)'
                        }}
                      >
                        {getTypeLabel(item.type)}
                      </span>
                      {item.isEquipped && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '5px',
                            right: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '0.56rem',
                            fontWeight: 800,
                            color: 'var(--color-primary)',
                            padding: '1px 5px',
                            borderRadius: '999px',
                            backgroundColor: 'rgba(29,185,84,0.14)',
                            border: '1px solid rgba(29,185,84,0.4)'
                          }}
                        >
                          <Check size={9} /> Equipped
                        </span>
                      )}
                      {renderItemPreview(item, 40)}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f3f4f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      <div>
                        <ItemRarityBadge
                          rarity={item.rarity}
                          source={item.source}
                          originTag={item.originTag}
                          scarcityLabel={item.scarcityLabel}
                          compact
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '2px' }}>
                      <Button
                        size="sm"
                        variant={item.isEquipped ? 'secondary' : 'primary'}
                        disabled={busyId === item.id}
                        onClick={() => handleEquip(item)}
                        style={{ width: '100%', padding: '5px 8px', fontSize: '0.74rem' }}
                      >
                        {item.isEquipped ? tx('Unequip', 'Lepas') : tx('Equip', 'Pasang')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Crate Pool Preview Modal (1 Mythic, 1 Legendary, 2 Epic) */}
      {poolModalCrate && (
        <div
          className="modal-backdrop"
          onClick={() => setPoolModalCrate(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '420px',
              width: '100%',
              backgroundColor: '#111116',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '20px',
              padding: '18px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: '#f3f4f6' }}>
                  {poolModalCrate.name}
                </h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)', marginTop: '2px', marginBottom: 0 }}>
                  {Object.entries(poolModalCrate.rates || {})
                    .map(([r, pct]) => `${RARITY_META[r]?.label || r} ${pct}%`)
                    .join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPoolModalCrate(null)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: '#16161e',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
              {(poolModalCrate.previewItems || []).map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    backgroundColor: '#16161e',
                    border: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      height: '66px',
                      borderRadius: '8px',
                      backgroundColor: '#0c0c10',
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 8px'
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '5px',
                        left: '6px',
                        fontSize: '0.56rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--color-text-dim)',
                        padding: '1px 5px',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(255,255,255,0.05)'
                      }}
                    >
                      {getTypeLabel(item.type)}
                    </span>
                    {renderItemPreview(item, 42)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#f3f4f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </div>
                    <ItemRarityBadge rarity={item.rarity} compact />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <CrateOpeningModal
        modalState={crateModal}
        user={user}
        useTicketForGacha={useTicketForGacha}
        gachaInfo={gachaInfo}
        busy={Boolean(busyId)}
        onClose={() => setCrateModal(null)}
        onPullAgain={handleGachaPull}
        onEquipItem={(item) => handleEquip({ ...item, isEquipped: false })}
      />
    </div>
  );
}

export default StorePage;

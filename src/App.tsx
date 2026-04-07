import { useState, useEffect, FC } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import classNames from 'classnames';
import * as Types from './Types';
import "./App.css";
import TextLabel from './components/TextLabel';
import ValueEditor from './components/ValueEditor';
import ArgsEditor from './components/ArgsEditor';
import CaseLabel from './components/CaseLabel';
import CaseEditor from './components/CaseEditor';
import { arrayEqual } from './utils/StringUtils';

type CaseProps = {
  id: Types.TText;
  value: string;
  bodies: [Types.TUserTextBody];
};

type BodyProps = {
  id: Types.TText;
  value: string;
  caseValues: [Types.UserTextCaseValue];
  caseArgs: [string];
  jp: [string];
};

function valuesEqual(a: Types.UserTextCaseValue[], b: Types.UserTextCaseValue[]): boolean {
  if (!Array.isArray(a)) return false;
  if (!Array.isArray(b)) return false;
  if (a.length != b.length) return false;
  for (var i = 0, n = a.length; i < n; ++i) {
    if (a[i].value !== b[i].value) return false;
    if (a[i].not !== b[i].not) return false;
  }
  return true;
}

const FILTERS = [
  { value: 'man', label: '人' },
  { value: 'dragon', label: 'ドラゴン' },
  { value: 'undead', label: 'アンデッド' },
  { value: 'slime', label: 'スライム' },
  { value: 'fire', label: '炎' },
  { value: 'sf', label: 'sf' },
  { value: 'yeek', label: 'イーク' },
  { value: 'mino', label: 'ミノタウロス' },
  { value: 'wild', label: '野生' },
  { value: 'pawn', label: '駒' },
  { value: 'shopguard', label: '傭兵' },
  { value: 'rogue', label: 'ごろつき' },
  { value: 'cat', label: 'ネコ' },
  { value: 'ether', label: 'エーテル' },
  { value: 'horse', label: '馬' },
  { value: 'cnpc', label: 'カスタムNPC' },
  { value: 'nogenerate', label: '自然生成なし' },
  { value: 'nodownload', label: 'ダウンロード対象外' },
];

const TABS = [
  { key: 'spec', label: '基本情報' },
  { key: 'ai', label: 'AI' },
  { key: 'resist', label: '耐性/補正' },
  { key: 'user-race', label: 'カスタム種族' },
  { key: 'user-class', label: 'カスタム職業' },
  { key: 'equip', label: '初期装備' },
  { key: 'text', label: 'テキスト' },
  { key: 'talk', label: '会話' },
];

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
  </svg>
);

function App() {
  const [ready, setReady] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('spec');
  const [character, setCharacter] = useState<Types.TCharacter>(
    {
      author: "",
      id: "",
      name: "",
      race: "",
      class: "",
      filter: [],
      level: 1,
      relation: -1,
      sex: -1,
      fix_lv: 0,
      rare: 1,
      spawn_type: 0,
      ai_calm: 1,
      ai_move: 50,
      ai_dist: 1,
      ai_heal: 0,
      ai_act0: 0,
      ai_act1: 0,
      ai_act2: 0,
      ai_act3: 0,
      ai_act4: 0,
      ai_act_sub_freq: 0,
      ai_act_sub0: 0,
      ai_act_sub1: 0,
      ai_act_sub2: 0,
      ai_act_sub3: 0,
      ai_act_sub4: 0,
      melee_elem_id: 0,
      melee_elem_power: 0,
      resist: [],
      bit_on: [],
      transmissivity: 0,
      drop_shadow_type: 0,
      c_set_pos: 16,
      no_food_or_drink: false,
      cnpc_role: 0,
      race_alias: "",
      class_alias: "",
      random_name: false,
      chipref: 0,
      colref: 0,
      user_race_enabled: false,
      user_race: {
        name: "",
        id: "",
        id2: 0,
        playable: false,
        sex: 0,
        pic: 0,
        pic2: 0,
        dv: 0,
        pv: 0,
        hp: 0,
        mp: 0,
        str: 0,
        end: 0,
        dex: 0,
        per: 0,
        ler: 0,
        wil: 0,
        mag: 0,
        chr: 0,
        spd: 1,
        melee_style: 0,
        cast_style: 0,
        resist: 0,
        age_rnd: 1,
        age: 1,
        blood: 0,
        breeder: 1,
        height: 1,
        skill: [],
        race_trait: [],
        figure: [],
        description: "",
        desc_e: "",
      },
      user_class_enabled: false,
      user_class: {
        name: "",
        id: "",
        playable: false,
        str: 0,
        end: 0,
        dex: 0,
        per: 0,
        ler: 0,
        wil: 0,
        mag: 0,
        chr: 0,
        spd: 1,
        equip: 0,
        skill: [],
        description: "",
        desc_e: "",
      },
      init_equip_enabled: false,
      init_equip: {
        head: "",
        head_custom_item_id: "",
        weapon1: "",
        weapon1_custom_item_id: "",
        shield: "",
        shield_custom_item_id: "",
        shoot: "",
        shoot_custom_item_id: "",
        ammo: "",
        ammo_custom_item_id: "",
        weapon2: "",
        weapon2_custom_item_id: "",
        body: "",
        body_custom_item_id: "",
        arm: "",
        arm_custom_item_id: "",
        leg: "",
        leg_custom_item_id: "",
        back: "",
        back_custom_item_id: "",
        waist: "",
        waist_custom_item_id: "",
        ring1: "",
        ring1_custom_item_id: "",
        ring2: "",
        ring2_custom_item_id: "",
        neck1: "",
        neck1_custom_item_id: "",
        neck2: "",
        neck2_custom_item_id: "",
      },
      txt_talk_order: false,
      txt: [
        { tag: "%txtCalm",    value: "", bodies: [{ case_values: [{ value: "", not: false }], case_args: [], jp: ["default"] }] },
        { tag: "%txtAggro",   value: "", bodies: [{ case_values: [{ value: "", not: false }], case_args: [], jp: ["default"] }] },
        { tag: "%txtDead",    value: "", bodies: [{ case_values: [{ value: "", not: false }], case_args: [], jp: ["default"] }] },
        { tag: "%txtKilled",  value: "", bodies: [{ case_values: [{ value: "", not: false }], case_args: [], jp: ["default"] }] },
        { tag: "%txtWelcome", value: "", bodies: [{ case_values: [{ value: "", not: false }], case_args: [], jp: ["default"] }] },
        { tag: "%txtDialog",  value: "", bodies: [{ case_values: [{ value: "", not: false }], case_args: [], jp: ["default"] }] },
      ],
      talk_enabled: false,
      talk: {
        jp: "%txt_ucnpc_ev_b\n%txtevstart,JP\n%txt_ucnpc_ev_e",
      }
    }
  );

  const [races, setRaces] = useState<Types.TRaceCollection | null>(null);
  const [classes, setClasses] = useState<Types.TClassCollection | null>(null);
  const [actions, setActions] = useState<Types.TActionCollection | null>(null);
  const [elements, setElements] = useState<Types.TElementCollection | null>(null);
  const [resistValues, setResistValues] = useState<Types.TResistValueCollection | null>(null);
  const [resistId, setResistId] = useState<Types.TElement | null>(null);
  const [resistValue, setResistValue] = useState<Types.TResistValue | null>(null);
  const [bits, setBits] = useState<Types.TBitCollection | null>(null);
  const [skills, setSkills] = useState<Types.TSkillCollection | null>(null);
  const [userRaceSkillId, setUserRaceSkillId] = useState<Types.TSkill | null>(null);
  const [userRaceSkillValue, setUserRaceSkillValue] = useState<number>(1);
  const [traits, setTraits] = useState<Types.TTraitCollection | null>(null);
  const [traitValues, setTraitValues] = useState<Types.TTraitValueCollection | null>(null);
  const [currentUserRaceTraitValues, setCurrentUserRaceTraitValues] = useState<Types.TTraitValue[]>([]);
  const [userRaceTraitId, setUserRaceTraitId] = useState<Types.TTrait | null>(null);
  const [userRaceTraitValue, setUserRaceTraitValue] = useState<Types.TTraitValue | null>(null);
  const [figures, setFigures] = useState<Types.TFigureCollection | null>(null);
  const [figureValue, setFigureValue] = useState<Types.TFigure | null>(null);
  const [userClassSkillId, setUserClassSkillId] = useState<Types.TSkill | null>(null);
  const [userClassSkillValue, setUserClassSkillValue] = useState<number>(1);
  const [items, setItems] = useState<Types.TItemCollection | null>(null);
  const [texts, setTexts] = useState<Types.TTextCollection | null>(null);
  const [caseGroups, setCaseGroups] = useState<Types.TCaseGroupCollection | null>(null);
  const [cases, setCases] = useState<Types.TCaseCollection | null>(null);
  const [textTag, setTextTag] = useState<Types.TText | null>(null);
  const [textValue, setTextValue] = useState<string>("");
  const [textCaseGroup, setTextCaseGroup] = useState<Types.TCaseGroup | null>(null);
  const [currentCases, setCurrentCases] = useState<Types.TCase[]>([]);
  const [textCase, setTextCase] = useState<Types.TCase | null>(null);
  const [caseValues, setCaseValues] = useState<Types.UserTextCaseValue[]>([]);
  const [textCaseArgs, setTextCaseArgs] = useState<string[]>([]);
  const [caseArgs, setCaseArgs] = useState<string[]>([]);
  const [textBodyJP, setTextBodyJP] = useState<string>("");

  useEffect(() => {
    (async () => {
      const ready = await invoke<boolean>("is_ready", {}).catch(err => { console.error(err); return false; });
      setReady(ready);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const races = await invoke<Types.TRaceCollection>("get_races", {}).catch(err => { console.error(err); return null; });
      setRaces(races);
      if (races && races.list) setCharacter(c => ({ ...c, race: races.list[0].id }));
    })();
  }, [ready]);

  useEffect(() => {
    (async () => {
      const classes = await invoke<Types.TClassCollection>("get_classes", {}).catch(err => { console.error(err); return null; });
      setClasses(classes);
      if (classes && classes.list) setCharacter(c => ({ ...c, class: classes.list[0].id }));
    })();
  }, [ready]);

  useEffect(() => {
    (async () => {
      const actions = await invoke<Types.TActionCollection>("get_actions", {}).catch(err => { console.error(err); return null; });
      setActions(actions);
    })();
  }, [ready]);

  useEffect(() => {
    (async () => {
      const elements = await invoke<Types.TElementCollection>("get_elements", {}).catch(err => { console.error(err); return null; });
      setElements(elements);
      if (elements && elements.list) setResistId(elements.list.filter((e) => e.id !== 64)[0]);
    })();
  }, [ready]);

  useEffect(() => {
    (async () => {
      const resistValues = await invoke<Types.TResistValueCollection>("get_resist_values", {}).catch(err => { console.error(err); return null; });
      setResistValues(resistValues);
      if (resistValues && resistValues.list) setResistValue(resistValues.list[0]);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const bits = await invoke<Types.TBitCollection>("get_bits", {}).catch(err => { console.error(err); return null; });
      setBits(bits);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const skills = await invoke<Types.TSkillCollection>("get_skills", {}).catch(err => { console.error(err); return null; });
      setSkills(skills);
      if (skills && skills.list) {
        setUserRaceSkillId(skills.list[0]);
        setUserClassSkillId(skills.list[0]);
      }
    })();
  }, [ready]);

  useEffect(() => {
    (async () => {
      const traits = await invoke<Types.TTraitCollection>("get_traits", {}).catch(err => { console.error(err); return null; });
      setTraits(traits);
      if (traits && traits.list) setUserRaceTraitId(traits.list[0]);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const traitValues = await invoke<Types.TTraitValueCollection>("get_trait_values", {}).catch(err => { console.error(err); return null; });
      setTraitValues(traitValues);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const figures = await invoke<Types.TFigureCollection>("get_figures", {}).catch(err => { console.error(err); return null; });
      setFigures(figures);
      if (figures && figures.list) setFigureValue(figures.list[0]);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const items = await invoke<Types.TItemCollection>("get_items", {}).catch(err => { console.error(err); return null; });
      setItems(items);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const texts = await invoke<Types.TTextCollection>("get_texts", {}).catch(err => { console.error(err); return null; });
      setTexts(texts);
      if (texts && texts.list) setTextTag(texts.list[0]);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const caseGroups = await invoke<Types.TCaseGroupCollection>("get_case_groups", {}).catch(err => { console.error(err); return null; });
      setCaseGroups(caseGroups);
      if (caseGroups && caseGroups.list) setTextCaseGroup(caseGroups.list[0]);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const cases = await invoke<Types.TCaseCollection>("get_cases", {}).catch(err => { console.error(err); return null; });
      setCases(cases);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (traits && traits.list && traitValues && traitValues.list) {
        const t = traits.list[0];
        const tv = traitValues.list.filter((v) => v.id === t.id);
        if (!tv) throw Error("trait value not found.");
        setCurrentUserRaceTraitValues(tv);
        setUserRaceTraitValue(tv[0]);
      }
    })();
  }, [traits, traitValues]);

  useEffect(() => {
    (async () => {
      if (traits && traits.list && traitValues && traitValues.list && userRaceTraitId) {
        let values = traitValues?.list.filter((v) => v.id === userRaceTraitId.id);
        if (!values) throw Error("trait value not found.");
        setCurrentUserRaceTraitValues(values);
        setUserRaceTraitValue(values[0]);
      }
    })();
  }, [userRaceTraitId]);

  useEffect(() => {
    (async () => {
      if (caseGroups && caseGroups.list && cases && cases.list) {
        const cg = caseGroups.list[0];
        const c = cases.list.filter((c) => c.expression === cg.expression);
        if (!c) throw Error("case not found.");
        setCurrentCases(c);
        setTextCase(c[0]);
      }
    })();
  }, [caseGroups, cases]);

  useEffect(() => {
    (async () => {
      if (caseGroups && caseGroups.list && cases && cases.list && textCaseGroup) {
        let c = cases.list.filter((c) => c.expression === textCaseGroup.expression);
        if (!c) throw Error("case not found.");
        setCurrentCases(c);
        setTextCase(c[0]);
      }
    })();
  }, [textCaseGroup]);

  function selectedDirectory() {
    (async () => {
      const path = await open({ directory: true });
      if (path !== null) {
        const ready = await invoke<boolean>("set_elona_dir", { path }).catch(err => { console.error(err); return false; });
        setReady(ready);
      }
    })();
  }

  function loadFile() {
    (async () => {
      const path = await open({ filters: [{ name: 'Text', extensions: ['txt'] }] });
      if (path !== null) {
        const c = await invoke<Types.TCharacter>("load_file", { path }).catch(err => { console.error(err); return null; });
        if (c) setCharacter({ ...c });
      }
    })();
  }

  function saveFile() {
    (async () => {
      const path = await save({ filters: [{ name: 'Text', extensions: ['txt'] }] });
      if (path !== null) {
        await invoke("save_file", { path: path, data: character });
      }
    })();
  }

  const BodyList: FC<BodyProps> = ({ id, value, caseValues, caseArgs, jp }) => {
    return (
      <div className="item-list-rows">
        {jp.map((text: string, i: number) => (
          <div key={i} className="item-row">
            <button type="button" className="btn-icon" onClick={(e) => {
              e.preventDefault();
              setCharacter({
                ...character,
                txt: character.txt.map((t2) =>
                  t2.tag === id.tag && t2.value === value
                    ? {
                        ...t2,
                        bodies: t2.bodies.map((b2) =>
                          valuesEqual(b2.case_values, caseValues) && arrayEqual(b2.case_args, caseArgs)
                            ? { ...b2, jp: b2.jp.filter((_, j) => j !== i) }
                            : b2
                        ),
                      }
                    : t2
                ),
              });
            }}>
              <XIcon />
            </button>
            <span className="item-row-text">{text}</span>
          </div>
        ))}
      </div>
    );
  };

  const CaseList: FC<CaseProps> = ({ id, value, bodies }) => {
    return (
      <div className="text-body-section">
        {bodies?.map((t: Types.TUserTextBody) => ({
          case_values: t.case_values,
          case_args: t.case_args,
          jp: t.jp,
        } as Types.TTextBodyListItem)).map((b: Types.TTextBodyListItem, i: number) => (
          <div key={i} style={{ marginBottom: '6px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
              <CaseLabel body={b} cases={cases} />
            </div>
            <BodyList id={id} value={value} caseValues={b.case_values} caseArgs={b.case_args} jp={b.jp} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="app">
      {!ready && (
        <div className="setup-overlay">
          <div className="setup-dialog">
            <h2>初回設定</h2>
            <p>始めに elona_omake_overhaul のフォルダを選択してください。</p>
            <button className="btn btn-primary" onClick={selectedDirectory}>フォルダを選択</button>
          </div>
        </div>
      )}

      <div className="toolbar">
        <span className="toolbar-title">Custom NPC Editor ver.2 mod</span>
        <div className="toolbar-sep" />
        <button type="button" className="btn" onClick={selectedDirectory}>設定</button>
        <button type="button" className="btn" onClick={loadFile}>読み込み</button>
        <button type="button" className="btn btn-primary" onClick={saveFile}>保存</button>
      </div>

      <div className="tabbar">
        {TABS.map(t => (
          <button key={t.key} className={classNames('tab', { active: activeTab === t.key })} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <form className="content" onSubmit={e => e.preventDefault()}>

        {/* ── 基本情報 ── */}
        {activeTab === 'spec' && (
          <div>
            <div className="section">
              <div className="section-header">基本情報</div>
              <div className="section-body">
                <div className="form-grid">
                  <div className="field">
                    <span className="field-label">作者名</span>
                    <input type="text" placeholder="作者名を入力..." value={character?.author} onChange={e => setCharacter({ ...character, author: e.target.value })} />
                  </div>
                  <div className="field">
                    <span className="field-label">英語名</span>
                    <input type="text" placeholder="英語名を入力..." value={character?.id} onChange={e => setCharacter({ ...character, id: e.target.value })} />
                  </div>
                  <div className="field">
                    <span className="field-label">日本語名</span>
                    <input type="text" placeholder="日本語名を入力..." value={character?.name} onChange={e => setCharacter({ ...character, name: e.target.value })} />
                  </div>
                  <div className="field">
                    <span className="field-label">種族</span>
                    <select disabled={character?.user_race_enabled} value={character?.race} onChange={e => setCharacter({ ...character, race: e.target.value })}>
                      {races?.list.map((e: Types.TRace, i: number) => <option key={i} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <span className="field-label">職業</span>
                    <select disabled={character?.user_class_enabled} value={character?.class} onChange={e => setCharacter({ ...character, class: e.target.value })}>
                      {classes?.list.map((e: Types.TClass, i: number) => <option key={i} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field" style={{ marginTop: '10px' }}>
                  <span className="field-label">属性</span>
                  <div className="tag-list">
                    {FILTERS.map(f => (
                      <span
                        key={f.value}
                        className={classNames('tag', { selected: character?.filter.includes(f.value) })}
                        onClick={() => {
                          const filters = character?.filter.includes(f.value)
                            ? character.filter.filter(x => x !== f.value)
                            : [...character.filter, f.value];
                          setCharacter({ ...character, filter: filters });
                        }}
                      >{f.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-header">パラメータ</div>
              <div className="section-body">
                <div className="form-grid form-grid-4">
                  <div className="field">
                    <span className="field-label">レベル</span>
                    <input type="number" min={1} max={2000} value={character?.level} onChange={e => setCharacter({ ...character, level: +e.target.value })} />
                  </div>
                  <div className="field">
                    <span className="field-label">関係</span>
                    <select value={character?.relation} onChange={e => setCharacter({ ...character, relation: +e.target.value })}>
                      <option value={-3}>敵対</option>
                      <option value={-2}>敵対一歩寸前</option>
                      <option value={-1}>無関心</option>
                      <option value={0}>中立</option>
                      <option value={10}>友好</option>
                    </select>
                  </div>
                  <div className="field">
                    <span className="field-label">性別</span>
                    <select value={character?.sex} onChange={e => setCharacter({ ...character, sex: +e.target.value })}>
                      <option value={-1}>ランダム</option>
                      <option value={0}>男</option>
                      <option value={1}>女</option>
                    </select>
                  </div>
                  <div className="field">
                    <span className="field-label">生成頻度</span>
                    <input type="number" min={1} max={500} value={character?.rare} onChange={e => setCharacter({ ...character, rare: +e.target.value })} />
                  </div>
                  <div className="field">
                    <span className="field-label">生成品質</span>
                    <select value={character?.fix_lv} onChange={e => setCharacter({ ...character, fix_lv: +e.target.value })}>
                      <option value={0}>ランダム</option>
                      <option value={1}>粗悪</option>
                      <option value={2}>良質</option>
                      <option value={3}>高品質</option>
                      <option value={4}>奇跡</option>
                      <option value={5}>神器</option>
                      <option value={6}>特別</option>
                    </select>
                  </div>
                  <div className="field">
                    <span className="field-label">生成条件</span>
                    <select value={character?.spawn_type} onChange={e => setCharacter({ ...character, spawn_type: +e.target.value })}>
                      <option value={0}>通常</option>
                      <option value={2}>通常(ユニーク)</option>
                      <option value={3}>特殊(ユニーク)</option>
                      <option value={4}>神々の休戦地、ルミエスト墓所</option>
                      <option value={5}>街</option>
                      <option value={6}>アクリ・テオラ</option>
                      <option value={7}>店、博物館</option>
                    </select>
                  </div>
                  <div className="field">
                    <span className="field-label">CNPC役割</span>
                    <select value={character?.cnpc_role} onChange={e => setCharacter({ ...character, cnpc_role: +e.target.value })}>
                      <option value={0}>しない</option>
                      <option value={1}>吟遊詩人</option>
                      <option value={2}>清掃員</option>
                      <option value={3}>娼婦</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-header">キャラクター設定</div>
              <div className="section-body">
                <div className="form-grid form-grid-4">
                  <div className="field">
                    <span className="field-label">透過率</span>
                    <input type="number" min={0} max={256} value={character?.transmissivity} onChange={e => setCharacter({ ...character, transmissivity: +e.target.value })} />
                  </div>
                  <div className="field">
                    <span className="field-label">影</span>
                    <input type="number" min={-1} max={150} value={character?.drop_shadow_type} onChange={e => setCharacter({ ...character, drop_shadow_type: +e.target.value })} />
                  </div>
                  <div className="field">
                    <span className="field-label">地面からの浮き具合</span>
                    <input type="number" min={16} max={32} value={character?.c_set_pos} onChange={e => setCharacter({ ...character, c_set_pos: +e.target.value })} />
                  </div>
                  <div className="field">
                    <span className="field-label">キャラチップ番号</span>
                    <input type="number" min={0} max={825} value={character?.chipref} onChange={e => setCharacter({ ...character, chipref: +e.target.value })} />
                  </div>
                  <div className="field">
                    <span className="field-label">色番号</span>
                    <input type="number" min={0} max={30} value={character?.colref} onChange={e => setCharacter({ ...character, colref: +e.target.value })} />
                  </div>
                  <div className="field">
                    <span className="field-label">種族の別名</span>
                    <input type="text" placeholder="別名..." value={character?.race_alias} onChange={e => setCharacter({ ...character, race_alias: e.target.value })} />
                  </div>
                  <div className="field">
                    <span className="field-label">職業の別名</span>
                    <input type="text" placeholder="別名..." value={character?.class_alias} onChange={e => setCharacter({ ...character, class_alias: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                  <label className="field field-inline">
                    <input type="checkbox" checked={character?.no_food_or_drink} onChange={e => setCharacter({ ...character, no_food_or_drink: e.target.checked })} />
                    <span className="field-label">飲食しない</span>
                  </label>
                  <label className="field field-inline">
                    <input type="checkbox" checked={character?.random_name} onChange={e => setCharacter({ ...character, random_name: e.target.checked })} />
                    <span className="field-label">ランダムネーム</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AI ── */}
        {activeTab === 'ai' && (
          <div>
            <div className="section">
              <div className="section-header">待機AI</div>
              <div className="section-body">
                <div className="form-grid form-grid-4">
                  <div className="field">
                    <span className="field-label">待機時行動</span>
                    <select value={character?.ai_calm} onChange={e => setCharacter({ ...character, ai_calm: +e.target.value })}>
                      <option value={1}>放浪</option>
                      <option value={2}>鈍感</option>
                      <option value={3}>停止</option>
                      <option value={4}>随行</option>
                    </select>
                  </div>
                  <div className="field">
                    <span className="field-label">移動確率 (%)</span>
                    <input type="number" min={0} max={100} value={character?.ai_move} onChange={e => setCharacter({ ...character, ai_move: +e.target.value })} />
                  </div>
                  <div className="field">
                    <span className="field-label">適正距離</span>
                    <input type="number" min={1} max={6} value={character?.ai_dist} onChange={e => setCharacter({ ...character, ai_dist: +e.target.value })} />
                  </div>
                  <div className="field">
                    <span className="field-label">瀕死時行動</span>
                    <select value={character?.ai_heal} onChange={e => setCharacter({ ...character, ai_heal: +e.target.value })}>
                      {actions?.list.map((e: Types.TAction, i: number) => <option key={i} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-header">基本行動</div>
              <div className="section-body">
                <div className="ai-action-grid">
                  {(['ai_act0', 'ai_act1', 'ai_act2', 'ai_act3', 'ai_act4'] as const).map((key, n) => (
                    <div key={key} className="field">
                      <span className="field-label">行動 {n + 1}</span>
                      <select value={character?.[key] as number} onChange={e => setCharacter({ ...character, [key]: +e.target.value })}>
                        {actions?.list.map((e: Types.TAction, i: number) => <option key={i} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-header">特殊行動</div>
              <div className="section-body">
                <div className="form-grid form-grid-4" style={{ marginBottom: '10px' }}>
                  <div className="field">
                    <span className="field-label">特殊行動率 (%)</span>
                    <input type="number" min={0} max={100} value={character?.ai_act_sub_freq} onChange={e => setCharacter({ ...character, ai_act_sub_freq: +e.target.value })} />
                  </div>
                </div>
                <div className="ai-action-grid">
                  {(['ai_act_sub0', 'ai_act_sub1', 'ai_act_sub2', 'ai_act_sub3', 'ai_act_sub4'] as const).map((key, n) => (
                    <div key={key} className="field">
                      <span className="field-label">特殊行動 {n + 1}</span>
                      <select value={character?.[key] as number} onChange={e => setCharacter({ ...character, [key]: +e.target.value })}>
                        {actions?.list.map((e: Types.TAction, i: number) => <option key={i} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-header">素手攻撃</div>
              <div className="section-body">
                <div className="form-grid">
                  <div className="field">
                    <span className="field-label">素手攻撃属性</span>
                    <select value={character?.melee_elem_id} onChange={e => setCharacter({ ...character, melee_elem_id: +e.target.value })}>
                      {elements?.list.map((e: Types.TElement, i: number) => <option key={i} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <span className="field-label">属性強度</span>
                    <input type="number" min={0} max={500} value={character?.melee_elem_power} onChange={e => setCharacter({ ...character, melee_elem_power: +e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 耐性/補正 ── */}
        {activeTab === 'resist' && (
          <div>
            <div className="section">
              <div className="section-header">耐性</div>
              <div className="section-body">
                <div className="item-controls">
                  <div className="field">
                    <span className="field-label">属性</span>
                    <select onChange={e => {
                      const v = elements?.list.find(el => el.id === +e.target.value);
                      if (v) setResistId(v);
                    }}>
                      {elements?.list.filter(e => e.id !== 64).map((e: Types.TElement, i: number) => <option key={i} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <span className="field-label">耐性値</span>
                    <select onChange={e => {
                      const v = resistValues?.list.find(rv => rv.value === +e.target.value);
                      if (v) setResistValue(v);
                    }}>
                      {resistValues?.list.map((e: Types.TResistValue, i: number) => <option key={i} value={e.value}>{e.label}({e.value})</option>)}
                    </select>
                  </div>
                  <button type="button" className="btn" onClick={() => {
                    if (character?.resist.some(r => r.id === resistId?.id)) return;
                    setCharacter({ ...character, resist: [...character.resist, { id: resistId?.id, value: resistValue?.value } as Types.TUserResist] });
                  }}>追加</button>
                </div>
                <div className="item-list-rows">
                  {character?.resist.map((r: Types.TUserResist) => ({
                    id: elements?.list.find(el => el.id === r.id),
                    value: resistValues?.list.find(rv => rv.value === r.value),
                  } as Types.TResist)).map((r: Types.TResist, i: number) => (
                    <div key={i} className="item-row">
                      <button type="button" className="btn-icon" onClick={() => setCharacter({ ...character, resist: character.resist.filter(e => e.id !== r.id.id) })}>
                        <XIcon />
                      </button>
                      <span className="item-row-text">{r.id?.name} — {r.value?.label}({r.value?.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-header">補正</div>
              <div className="section-body">
                <div className="tag-list">
                  {bits?.list.map((bit: Types.TBit) => (
                    <span
                      key={bit.value}
                      className={classNames('tag', { selected: character?.bit_on.includes(bit.value) })}
                      onClick={() => {
                        const newBits = character?.bit_on.includes(bit.value)
                          ? character.bit_on.filter(x => x !== bit.value)
                          : [...character.bit_on, bit.value];
                        setCharacter({ ...character, bit_on: newBits });
                      }}
                    >{bit.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── カスタム種族 ── */}
        {activeTab === 'user-race' && (
          <div>
            <div className="section">
              <div className="section-header">
                <label className="field field-inline" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
                  <input type="checkbox" checked={character?.user_race_enabled} onChange={e => setCharacter({ ...character, user_race_enabled: e.target.checked })} />
                  <span className="field-label">専用種族を使用する</span>
                </label>
              </div>
            </div>

            {character?.user_race_enabled && <>
              <div className="section">
                <div className="section-header">基本情報</div>
                <div className="section-body">
                  <div className="form-grid form-grid-3">
                    <div className="field">
                      <span className="field-label">日本語名</span>
                      <input type="text" placeholder="種族名..." value={character?.user_race.name} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, name: e.target.value } })} />
                    </div>
                    <div className="field">
                      <span className="field-label">英語名</span>
                      <input type="text" placeholder="英語名..." value={character?.user_race.id} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, id: e.target.value } })} />
                    </div>
                    <label className="field field-inline">
                      <input type="checkbox" checked={character?.user_race.playable} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, playable: e.target.checked } })} />
                      <span className="field-label">プレイアブル</span>
                    </label>
                    <div className="field">
                      <span className="field-label">性別(男性確率%)</span>
                      <input type="number" min={0} max={100} value={character?.user_race.sex} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, sex: +e.target.value } })} />
                    </div>
                    <div className="field">
                      <span className="field-label">男性グラフィック番号</span>
                      <input type="number" min={0} max={824} value={character?.user_race.pic} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, pic: +e.target.value } })} />
                    </div>
                    <div className="field">
                      <span className="field-label">女性グラフィック番号</span>
                      <input type="number" min={0} max={824} value={character?.user_race.pic2} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, pic2: +e.target.value } })} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">基礎パラメータ</div>
                <div className="section-body">
                  <div className="form-grid form-grid-4">
                    {([['dv','DV',0,1000],['pv','PV',0,1000],['hp','HP',0,500],['mp','MP',0,500],['str','筋力',0,35],['end','耐久',0,35],['dex','器用',0,35],['per','感知',0,35],['ler','学習',0,35],['wil','意志',0,35],['mag','魔力',0,35],['chr','魅力',0,35],['spd','速度',1,200]] as [string,string,number,number][]).map(([k,l,mn,mx]) => (
                      <div key={k} className="field">
                        <span className="field-label">{l}</span>
                        <input type="number" min={mn} max={mx} value={(character?.user_race as any)[k]} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, [k]: +e.target.value } })} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">スタイル</div>
                <div className="section-body">
                  <div className="form-grid form-grid-3">
                    <div className="field">
                      <span className="field-label">近接スタイル</span>
                      <select value={character?.user_race.melee_style} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, melee_style: +e.target.value } })}>
                        <option value={0}>なし</option>
                        <option value={1}>片手武器+盾</option>
                        <option value={2}>両手武器</option>
                        <option value={3}>二刀流</option>
                        <option value={4}>素手</option>
                        <option value={5}>盾のみ</option>
                      </select>
                    </div>
                    <div className="field">
                      <span className="field-label">詠唱スタイル</span>
                      <select value={character?.user_race.cast_style} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, cast_style: +e.target.value } })}>
                        <option value={0}>なし</option>
                        <option value={1}>呪文詠唱</option>
                        <option value={2}>歌詠唱</option>
                      </select>
                    </div>
                    <div className="field">
                      <span className="field-label">耐性スタイル</span>
                      <select value={character?.user_race.resist} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, resist: +e.target.value } })}>
                        <option value={0}>なし</option>
                        <option value={1}>エルフ</option>
                        <option value={2}>ノーム</option>
                        <option value={3}>フェアリー</option>
                        <option value={4}>ゴーレム</option>
                        <option value={5}>ドラコン</option>
                        <option value={6}>種族特有</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">その他</div>
                <div className="section-body">
                  <div className="form-grid form-grid-4">
                    <div className="field">
                      <span className="field-label">年齢ランダム幅</span>
                      <input type="number" min={1} max={100} value={character?.user_race.age_rnd} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, age_rnd: +e.target.value } })} />
                    </div>
                    <div className="field">
                      <span className="field-label">初期年齢</span>
                      <input type="number" min={1} max={1000} value={character?.user_race.age} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, age: +e.target.value } })} />
                    </div>
                    <div className="field">
                      <span className="field-label">血統</span>
                      <select value={character?.user_race.blood} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, blood: +e.target.value } })}>
                        <option value={0}>有機物</option>
                        <option value={1}>無機物</option>
                      </select>
                    </div>
                    <div className="field">
                      <span className="field-label">繁殖係数</span>
                      <input type="number" min={1} max={10} value={character?.user_race.breeder} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, breeder: +e.target.value } })} />
                    </div>
                    <div className="field">
                      <span className="field-label">身長</span>
                      <input type="number" min={1} max={300} value={character?.user_race.height} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, height: +e.target.value } })} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">スキル</div>
                <div className="section-body">
                  <div className="item-controls">
                    <div className="field">
                      <span className="field-label">スキル</span>
                      <select onChange={e => {
                        const v = skills?.list.find(s => s.id === +e.target.value);
                        if (v) setUserRaceSkillId(v);
                      }}>
                        {skills?.list.map((s: Types.TSkill, i: number) => <option key={i} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="field" style={{ maxWidth: '80px' }}>
                      <span className="field-label">値</span>
                      <input type="number" min={1} max={20} value={userRaceSkillValue} onChange={e => setUserRaceSkillValue(+e.target.value)} />
                    </div>
                    <button type="button" className="btn" onClick={() => {
                      if (character?.user_race.skill.some((s: any) => s.id === userRaceSkillId?.id)) return;
                      if (!userRaceSkillId) return;
                      setCharacter({ ...character, user_race: { ...character.user_race, skill: [...character.user_race.skill, { id: userRaceSkillId.id, value: userRaceSkillValue } as Types.TUserSkill] } });
                    }}>追加</button>
                  </div>
                  <div className="item-list-rows">
                    {character?.user_race.skill.map((s: any, i: number) => (
                      <div key={i} className="item-row">
                        <button type="button" className="btn-icon" onClick={() => setCharacter({ ...character, user_race: { ...character.user_race, skill: character.user_race.skill.filter((_: any, j: number) => j !== i) } })}>
                          <XIcon />
                        </button>
                        <span className="item-row-text">{skills?.list.find(sk => sk.id === s.id)?.name} — {s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">種族特性</div>
                <div className="section-body">
                  <div className="item-controls">
                    <div className="field">
                      <span className="field-label">特性</span>
                      <select onChange={e => {
                        const v = traits?.list.find(t => t.id === +e.target.value);
                        if (v) setUserRaceTraitId(v);
                      }}>
                        {traits?.list.map((t: Types.TTrait, i: number) => <option key={i} value={t.id}>{t.text}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <span className="field-label">値</span>
                      <select value={userRaceTraitValue?.value} onChange={e => {
                        const v = currentUserRaceTraitValues.find(tv => tv.value === +e.target.value);
                        if (v) setUserRaceTraitValue(v);
                      }}>
                        {currentUserRaceTraitValues.map((tv: Types.TTraitValue, i: number) => <option key={i} value={tv.value}>{tv.text}</option>)}
                      </select>
                    </div>
                    <button type="button" className="btn" onClick={() => {
                      if (character?.user_race.race_trait.some((t: any) => t.id === userRaceTraitId?.id)) return;
                      if (!userRaceTraitId || userRaceTraitValue === null) return;
                      setCharacter({ ...character, user_race: { ...character.user_race, race_trait: [...character.user_race.race_trait, { id: userRaceTraitId.id, value: userRaceTraitValue!.value } as Types.TUserTrait] } });
                    }}>追加</button>
                  </div>
                  <div className="item-list-rows">
                    {character?.user_race.race_trait.map((t: any, i: number) => (
                      <div key={i} className="item-row">
                        <button type="button" className="btn-icon" onClick={() => setCharacter({ ...character, user_race: { ...character.user_race, race_trait: character.user_race.race_trait.filter((_: any, j: number) => j !== i) } })}>
                          <XIcon />
                        </button>
                        <span className="item-row-text">
                          {traits?.list.find(tr => tr.id === t.id)?.text} — {traitValues?.list.find(tv => tv.id === t.id && tv.value === t.value)?.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">外見</div>
                <div className="section-body">
                  <div className="item-controls">
                    <div className="field">
                      <span className="field-label">外見</span>
                      <select value={figureValue?.value ?? ""} onChange={e => {
                        const v = figures?.list.find(f => f.value === e.target.value);
                        if (v) setFigureValue(v);
                      }}>
                        {figures?.list.map((f: Types.TFigure, i: number) => <option key={i} value={f.value}>{f.value}</option>)}
                      </select>
                    </div>
                    <button type="button" className="btn" onClick={() => {
                      if (!figureValue) return;
                      if (character?.user_race.figure.some((f: Types.TFigure) => f.value === figureValue.value)) return;
                      setCharacter({ ...character, user_race: { ...character.user_race, figure: [...character.user_race.figure, { value: figureValue.value }] } });
                    }}>追加</button>
                  </div>
                  <div className="item-list-rows">
                    {character?.user_race.figure.map((f: Types.TFigure, i: number) => (
                      <div key={i} className="item-row">
                        <button type="button" className="btn-icon" onClick={() => setCharacter({ ...character, user_race: { ...character.user_race, figure: character.user_race.figure.filter((_: Types.TFigure, j: number) => j !== i) } })}>
                          <XIcon />
                        </button>
                        <span className="item-row-text">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">説明</div>
                <div className="section-body">
                  <div className="form-grid form-grid-1">
                    <div className="field">
                      <span className="field-label">日本語説明</span>
                      <textarea value={character?.user_race.description} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, description: e.target.value } })} />
                    </div>
                    <div className="field">
                      <span className="field-label">英語説明</span>
                      <textarea value={character?.user_race.desc_e} onChange={e => setCharacter({ ...character, user_race: { ...character.user_race, desc_e: e.target.value } })} />
                    </div>
                  </div>
                </div>
              </div>
            </>}
          </div>
        )}

        {/* ── カスタム職業 ── */}
        {activeTab === 'user-class' && (
          <div>
            <div className="section">
              <div className="section-header">
                <label className="field field-inline" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
                  <input type="checkbox" checked={character?.user_class_enabled} onChange={e => setCharacter({ ...character, user_class_enabled: e.target.checked })} />
                  <span className="field-label">専用職業を使用する</span>
                </label>
              </div>
            </div>

            {character?.user_class_enabled && <>
              <div className="section">
                <div className="section-header">基本情報</div>
                <div className="section-body">
                  <div className="form-grid form-grid-3">
                    <div className="field">
                      <span className="field-label">日本語名</span>
                      <input type="text" placeholder="職業名..." value={character?.user_class.name} onChange={e => setCharacter({ ...character, user_class: { ...character.user_class, name: e.target.value } })} />
                    </div>
                    <div className="field">
                      <span className="field-label">英語名</span>
                      <input type="text" placeholder="英語名..." value={character?.user_class.id} onChange={e => setCharacter({ ...character, user_class: { ...character.user_class, id: e.target.value } })} />
                    </div>
                    <label className="field field-inline">
                      <input type="checkbox" checked={character?.user_class.playable} onChange={e => setCharacter({ ...character, user_class: { ...character.user_class, playable: e.target.checked } })} />
                      <span className="field-label">プレイアブル</span>
                    </label>
                    <div className="field">
                      <span className="field-label">装備タイプ</span>
                      <select value={character?.user_class.equip} onChange={e => setCharacter({ ...character, user_class: { ...character.user_class, equip: +e.target.value } })}>
                        <option value={0}>なし</option>
                        <option value={1}>戦士</option>
                        <option value={2}>魔法使い</option>
                        <option value={3}>弓使い</option>
                        <option value={4}>盗賊</option>
                        <option value={5}>僧侶</option>
                        <option value={6}>錬金術師</option>
                        <option value={7}>銃使い</option>
                        <option value={8}>護衛兵</option>
                        <option value={17}>ピアノ奏者</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">基礎パラメータ</div>
                <div className="section-body">
                  <div className="form-grid form-grid-4">
                    {([['str','筋力'],['end','耐久'],['dex','器用'],['per','感知'],['ler','学習'],['wil','意志'],['mag','魔力'],['chr','魅力'],['spd','速度']] as [string,string][]).map(([k,l]) => (
                      <div key={k} className="field">
                        <span className="field-label">{l}</span>
                        <input type="number" min={k === 'spd' ? 1 : 0} max={k === 'spd' ? 200 : 30} value={(character?.user_class as any)[k]} onChange={e => setCharacter({ ...character, user_class: { ...character.user_class, [k]: +e.target.value } })} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">スキル</div>
                <div className="section-body">
                  <div className="item-controls">
                    <div className="field">
                      <span className="field-label">スキル</span>
                      <select onChange={e => {
                        const v = skills?.list.find(s => s.id === +e.target.value);
                        if (v) setUserClassSkillId(v);
                      }}>
                        {skills?.list.map((s: Types.TSkill, i: number) => <option key={i} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="field" style={{ maxWidth: '80px' }}>
                      <span className="field-label">値</span>
                      <input type="number" min={1} max={20} value={userClassSkillValue} onChange={e => setUserClassSkillValue(+e.target.value)} />
                    </div>
                    <button type="button" className="btn" onClick={() => {
                      if (character?.user_class.skill.some((s: any) => s.id === userClassSkillId?.id)) return;
                      if (!userClassSkillId) return;
                      setCharacter({ ...character, user_class: { ...character.user_class, skill: [...character.user_class.skill, { id: userClassSkillId.id, value: userClassSkillValue } as Types.TUserSkill] } });
                    }}>追加</button>
                  </div>
                  <div className="item-list-rows">
                    {character?.user_class.skill.map((s: any, i: number) => (
                      <div key={i} className="item-row">
                        <button type="button" className="btn-icon" onClick={() => setCharacter({ ...character, user_class: { ...character.user_class, skill: character.user_class.skill.filter((_: any, j: number) => j !== i) } })}>
                          <XIcon />
                        </button>
                        <span className="item-row-text">{skills?.list.find(sk => sk.id === s.id)?.name} — {s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">説明</div>
                <div className="section-body">
                  <div className="form-grid form-grid-1">
                    <div className="field">
                      <span className="field-label">日本語説明</span>
                      <textarea value={character?.user_class.description} onChange={e => setCharacter({ ...character, user_class: { ...character.user_class, description: e.target.value } })} />
                    </div>
                    <div className="field">
                      <span className="field-label">英語説明</span>
                      <textarea value={character?.user_class.desc_e} onChange={e => setCharacter({ ...character, user_class: { ...character.user_class, desc_e: e.target.value } })} />
                    </div>
                  </div>
                </div>
              </div>
            </>}
          </div>
        )}

        {/* ── 初期装備 ── */}
        {activeTab === 'equip' && (
          <div>
            <div className="section">
              <div className="section-header">
                <label className="field field-inline" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
                  <input type="checkbox" checked={character?.init_equip_enabled} onChange={e => setCharacter({ ...character, init_equip_enabled: e.target.checked })} />
                  <span className="field-label">初期装備を設定する</span>
                </label>
              </div>
            </div>

            {character?.init_equip_enabled && (
              <div className="section">
                <div className="section-header">装備スロット</div>
                <div className="section-body">
                  <div className="equip-grid">
                    {([
                      ['head', '頭', [0, 12000]],
                      ['weapon1', '武器1', [0, 10000, 24000]],
                      ['shield', '盾', [0, 14000]],
                      ['shoot', '射撃武器', [0, 24000]],
                      ['ammo', '弾薬', [0, 25000]],
                      ['weapon2', '武器2', [0, 10000, 24000]],
                      ['body', '胴体', [0, 16000]],
                      ['arm', '腕', [0, 22000]],
                      ['leg', '足', [0, 18000]],
                      ['back', '背中', [0, 20000]],
                      ['waist', '腰', [0, 19000]],
                      ['ring1', '指輪1', [0, 32000]],
                      ['ring2', '指輪2', [0, 32000]],
                      ['neck1', '首飾り1', [0, 34000]],
                      ['neck2', '首飾り2', [0, 34000]],
                    ] as [string, string, number[]][]).map(([slotKey, label, reftypes]) => {
                      const fieldKey = slotKey as keyof typeof character.init_equip;
                      const customKey = `${slotKey}_custom_item_id` as keyof typeof character.init_equip;
                      const currentVal = character?.init_equip[fieldKey] as string;
                      return (
                        <div key={slotKey} className="equip-field">
                          <span className="equip-field-label">{label}</span>
                          <div className="equip-slot-inputs">
                            <select value={currentVal} onChange={e => setCharacter({ ...character, init_equip: { ...character.init_equip, [fieldKey]: e.target.value } })}>
                              {items?.list.filter(item => reftypes.includes(item.reftype)).map((item: Types.TItem, i: number) => (
                                <option key={i} value={item.id}>{item.name}</option>
                              ))}
                            </select>
                            {currentVal === "743" && (
                              <input type="text" placeholder="カスタムアイテムID..." value={character?.init_equip[customKey] as string} onChange={e => setCharacter({ ...character, init_equip: { ...character.init_equip, [customKey]: e.target.value } })} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── テキスト ── */}
        {activeTab === 'text' && (
          <div>
            <div className="section">
              <div className="section-header">テキスト追加</div>
              <div className="section-body">
                <div className="text-add-area">
                  <div className="field">
                    <span className="field-label">テキスト種別</span>
                    <select onChange={e => {
                      const t = texts?.list.find(t => t.tag == e.target.value);
                      if (!t) return;
                      setTextTag(t);
                      setTextValue("");
                    }}>
                      {texts?.list.map((t: Types.TText, i: number) => <option key={i} value={t.tag}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <span className="field-label">値</span>
                    <ValueEditor textId={textTag} actions={actions} onValueChange={(value: string) => setTextValue(value)} />
                  </div>
                  <div className="field">
                    <span className="field-label">ケースグループ</span>
                    <select value={textCaseGroup?.expression} onChange={e => {
                      const g = caseGroups?.list.find(g => g.expression == e.target.value);
                      if (!g) return;
                      setTextCaseGroup(g);
                      setTextCaseArgs([]);
                    }}>
                      {caseGroups?.list.map((g: Types.TCaseGroup, i: number) => <option key={i} value={g.expression}>{g.label}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <span className="field-label">ケース</span>
                    <select value={textCase?.value} onChange={e => {
                      const c = currentCases?.find(c => c.value == e.target.value);
                      if (!c) return;
                      setTextCase(c);
                      setTextCaseArgs([]);
                    }}>
                      {currentCases?.map((c: Types.TCase, i: number) => <option key={i} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <span className="field-label">引数</span>
                    <ArgsEditor textCase={textCase} races={races} classes={classes} onArgsChange={(values: string[]) => setTextCaseArgs(values)} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                  <button type="button" className="btn" onClick={() => {
                    if (!textTag || !textCase || textCase.value == "") return;
                    const size = textCase.args_size;
                    if (textCaseArgs.length != size || textCaseArgs.some(v => v == "")) return;
                    if (caseValues.length == 0) {
                      setCaseValues([...caseValues, { value: textCase.value, not: false }]);
                    } else {
                      setCaseValues([...caseValues, { value: ",", not: false }, { value: textCase.value, not: false }]);
                    }
                    setCaseArgs([...caseArgs, ...textCaseArgs]);
                  }}>ケース追加</button>

                  {caseValues.length > 0 && (
                    <button type="button" className="btn-icon" onClick={() => { setCaseValues([]); setCaseArgs([]); }}>
                      <XIcon />
                    </button>
                  )}
                </div>

                {caseValues.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <CaseEditor caseValues={caseValues} caseArgs={caseArgs} cases={cases} onValuesChange={(values: Types.UserTextCaseValue[]) => setCaseValues(values)} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginTop: '10px' }}>
                  <div className="field" style={{ flex: 1 }}>
                    <span className="field-label">テキスト (日本語)</span>
                    <textarea placeholder="台詞を入力..." value={textBodyJP} onChange={e => setTextBodyJP(e.target.value)} />
                  </div>
                  <button type="button" className="btn btn-primary" style={{ flexShrink: 0 }} onClick={() => {
                    if (!textTag) return;
                    const t = character?.txt?.find(t => t.tag == textTag.tag && t.value == textValue);
                    if (t) {
                      const effectiveCaseValues = caseValues.length == 0 ? [{ value: "", not: false }] : caseValues;
                      const b = caseValues.length == 0
                        ? t.bodies.find(b => valuesEqual(b.case_values, [{ value: "", not: false }]))
                        : t.bodies.find(b => valuesEqual(b.case_values, caseValues) && arrayEqual(b.case_args, caseArgs));
                      if (b) {
                        setCharacter({
                          ...character,
                          txt: character.txt.map(t2 =>
                            t2.tag === textTag.tag && t2.value === textValue
                              ? {
                                  ...t2,
                                  bodies: t2.bodies.map(b2 =>
                                    valuesEqual(b2.case_values, effectiveCaseValues) && arrayEqual(b2.case_args, caseArgs)
                                      ? { ...b2, jp: [...b2.jp, textBodyJP] }
                                      : b2
                                  )
                                }
                              : t2
                          )
                        });
                      } else {
                        setCharacter({
                          ...character,
                          txt: character.txt.map(t2 =>
                            t2.tag === textTag.tag && t2.value === textValue
                              ? { ...t2, bodies: [...t2.bodies, { case_values: effectiveCaseValues, case_args: caseArgs, jp: [textBodyJP] } as Types.TUserTextBody] }
                              : t2
                          )
                        });
                      }
                    } else {
                      const effectiveCaseValues = caseValues.length == 0 ? [{ value: "", not: false }] : caseValues;
                      setCharacter({
                        ...character,
                        txt: [
                          ...character.txt,
                          { tag: textTag.tag, value: textValue, bodies: [{ case_values: effectiveCaseValues, case_args: caseArgs, jp: [textBodyJP] } as Types.TUserTextBody] } as Types.TUserText
                        ]
                      });
                    }
                    setTextBodyJP("");
                  }}>テキスト追加</button>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-header">登録済みテキスト</div>
              <div className="section-body" style={{ padding: '8px' }}>
                {texts && cases ? character?.txt.map((t: Types.TUserText) => ({
                  tag: texts?.list.find(text => text.tag === t.tag),
                  value: t.value,
                  bodies: t.bodies,
                } as Types.TTextListItem)).map((t: Types.TTextListItem, i: number) => (
                  <div key={i} className="text-entry">
                    <div className="text-entry-header">
                      <TextLabel id={t.tag} value={t.value} />
                      {t.tag?.tag === '%txtDialog' && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', fontSize: '12px', marginLeft: '8px' }}>
                          <input type="checkbox" checked={character?.txt_talk_order} onChange={e => setCharacter({ ...character, txt_talk_order: e.target.checked })} />
                          順番に話す
                        </label>
                      )}
                    </div>
                    <CaseList id={t.tag} value={t.value} bodies={t.bodies} />
                  </div>
                )) : null}
              </div>
            </div>
          </div>
        )}

        {/* ── 会話 ── */}
        {activeTab === 'talk' && (
          <div>
            <div className="section">
              <div className="section-header">
                <label className="field field-inline" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
                  <input type="checkbox" checked={character?.talk_enabled} onChange={e => setCharacter({ ...character, talk_enabled: e.target.checked })} />
                  <span className="field-label">選択肢会話を使用する</span>
                </label>
              </div>
            </div>
            <div className="section">
              <div className="section-body">
                <div className="field">
                  <span className="field-label">会話スクリプト (日本語)</span>
                  <textarea style={{ minHeight: '280px' }} disabled={!character?.talk_enabled} value={character?.talk.jp} onChange={e => setCharacter({ ...character, talk: { ...character.talk, jp: e.target.value } })} />
                </div>
              </div>
            </div>
          </div>
        )}

      </form>
    </div>
  );
}

export default App;

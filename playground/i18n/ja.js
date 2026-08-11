// Japanese translations for Cesium Heatbox Playground
if (typeof window !== 'undefined') {
  window.HeatboxI18N = window.HeatboxI18N || {};
  window.HeatboxI18N.ja = {
    // Profile descriptions
    profile_desc_custom: '全設定を手動でカスタマイズ',
    profile_desc_mobile: 'モバイルデバイス最適化：高速描画・品質抑制',
    profile_desc_desktop: 'デスクトップ環境でのバランス重視性能',
    profile_desc_dense: '高密度データセット（多データポイント）最適化',
    profile_desc_sparse: '疎データセット（少データポイント）最適化',
    
    // Extended UI labels
    sum_profiles: 'プリセット',
    label_profile: 'プロファイル',
    opt_profile_custom: 'カスタム（プロファイルなし）',
    opt_profile_mobile: 'モバイル高速',
    opt_profile_desktop: 'デスクトップバランス',
    opt_profile_dense: '高密度データ',
    opt_profile_sparse: '疎データ',
    
    sum_performance: 'パフォーマンス',
    chk_performanceOverlay: 'パフォーマンス表示を有効化',
    label_overlayPosition: '表示位置',
    opt_pos_topleft: '左上',
    opt_pos_topright: '右上',
    opt_pos_bottomleft: '左下',
    opt_pos_bottomright: '右下',
    label_overlayUpdate: '更新間隔 (ms)',
    
    label_emulationScope: 'エミュレーション範囲',
    label_legacyEmulation: '⚠️ 旧outlineEmulation（廃止予定）',
    opt_legacy_none: '上のemulationScopeを使用',
    
    btn_getEffectiveOptions: '有効オプション取得',
    
    // Preset updates
    opt_preset_thin: '細い',
    opt_preset_medium: '中', 
    opt_preset_thick: '太い',
    opt_preset_adaptive: '適応',
    opt_preset_uniform_legacy: '⚠️ 均一（廃止予定 → 中）',
    opt_preset_density_legacy: '⚠️ 密度適応（廃止予定 → 適応）',
    opt_preset_topn_legacy: '⚠️ TopN重視（廃止予定 → 太い）'
    ,
    // View Mode (Playground)
    sum_viewmode: 'ボクセル表示',
    label_viewmode_preset: 'プリセット',
    opt_view_boxes: 'ボックスのみ',
    opt_view_outline: '枠線のみ',
    opt_view_outline_inset: '枠線＋インセット',
    opt_view_emulation: 'エミュレーションのみ'
  };
}

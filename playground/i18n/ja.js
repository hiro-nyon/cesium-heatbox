;(function(global){
  global.HEATBOX_I18N = global.HEATBOX_I18N || {};
  global.HEATBOX_I18N.ja = {
    // Navigation + headings
    nav_stats_title: '統計情報',
    nav_label_dataCount: 'データ',
    nav_label_voxelCount: 'ボクセル',
    nav_label_maxValue: '最大',
    nav_label_minValue: '最小',
    detail_title: '詳細統計',
    autosize_title: '自動サイズ',
    autosize_adjusted: '自動調整',
    autosize_size: 'サイズ',
    or_title: 'Outline 統計',
    or_calls: '回数',
    or_avg: '平均',
    or_minmax: '最小/最大',
    or_dminmax: '密度 最小/最大',
    or_topn: 'Top-N',
    loading: '読み込み中...',

    // Toolbar base
    playground_title: 'Cesium Heatbox Playground',
    subtitle: '高度なコントロール',
    label_language: '言語',
    lang_en: 'English',
    lang_ja: '日本語',

    // Data
    sum_data: 'データ読み込み',
    label_dataSource: 'データソース',
    btn_load_sample: 'サンプルデータを読み込み',
    btn_generate_test: 'テストデータを生成',

    // Profiles (v0.1.12)
    sum_profiles: '設定プロファイル (v0.1.12)',
    label_profile: 'プロファイル',
    opt_profile_custom: 'カスタム（なし）',
    opt_profile_mobile: 'モバイル高速',
    opt_profile_desktop: 'デスクトップバランス',
    opt_profile_dense: '高密度データ',
    opt_profile_sparse: '疎データ',
    profile_desc_custom: 'すべて手動で設定できます',
    profile_desc_mobile: 'モバイル向け — 性能優先',
    profile_desc_desktop: 'デスクトップ向けのバランス設定',
    profile_desc_dense: '高密度データに最適化',
    profile_desc_sparse: '疎なデータに最適化',

    // Basic config
    sum_basic: '基本設定',
    label_baseMap: '背景地図',
    chk_autoView: '自動ビュー',
    label_fitViewHeading: 'Fit View ヘディング角 (度)',
    label_fitViewPitch: 'Fit View ピッチ角 (度)',
    btn_fitView: 'ビューを合わせる',

    // Performance overlay (v0.1.12)
    sum_performance: 'パフォーマンスオーバーレイ (v0.1.12)',
    chk_performanceOverlay: 'パフォーマンスオーバーレイを有効化',
    label_overlayPosition: '表示位置',
    opt_pos_topleft: '左上',
    opt_pos_topright: '右上',
    opt_pos_bottomleft: '左下',
    opt_pos_bottomright: '右下',
    label_overlayUpdate: '更新間隔 (ms)',

    // Voxel config
    sum_voxel: 'ボクセル設定',
    chk_autoVoxel: '自動ボクセルサイズ',
    label_autoVoxelMode: '自動サイズモード',
    opt_autoVoxel_simple: 'シンプル',
    opt_autoVoxel_occupancy: '占有率',
    label_gridSize: 'グリッドサイズ',

    // Emulation & outlines
    h4_outline_emulation: '太線エミュレーション（WebGL制約の回避）',
    label_emulationScope: 'エミュレーション範囲 (v0.1.12)',
    opt_emul_off: '無効',
    opt_emul_topn: 'Top-N のみ',
    opt_emul_non_topn: 'Top-N 以外のみ',
    opt_emul_all: 'すべて',
    label_legacyEmulation: '⚠️ 旧 outlineEmulation（非推奨）',
    label_outlineRenderMode: '描画モード',
    opt_render_standard: '標準',
    opt_render_inset: 'インセット優先',
    opt_render_emulation: 'エミュレーションのみ',

    // Adaptive
    h4_adaptive_control: '適応制御',
    chk_adaptiveOutlines: '適応枠線制御を有効化',
    label_outlinePreset: '枠線プリセット (v0.1.12 更新)',
    opt_preset_thin: 'Thin',
    opt_preset_medium: 'Medium',
    opt_preset_thick: 'Thick',
    opt_preset_adaptive: 'Adaptive',
    opt_preset_uniform_legacy: '⚠️ Uniform（非推奨 → Medium）',
    opt_preset_density_legacy: '⚠️ Density（非推奨 → Adaptive）',
    opt_preset_topn_legacy: '⚠️ Top-N（非推奨 → Thick）',

    // Debug & actions
    h4_debug_dev: 'デバッグ / 開発',
    chk_debugMode: 'デバッグモード（ログ出力）',
    chk_showBounds: '境界ボックスを表示',
    btn_testHeatbox: 'Heatbox テスト',
    btn_getEffectiveOptions: '🆕 有効設定を取得 (v0.1.12)',
    sum_actions: '操作',
    btn_create: 'ヒートマップ作成',
    btn_clear: 'クリア',
    btn_toggle: '表示/非表示',
    btn_export: 'データ出力'
  };
})(window);


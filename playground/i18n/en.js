;(function(global){
  global.HEATBOX_I18N = global.HEATBOX_I18N || {};
  global.HEATBOX_I18N.en = {
    // Navigation + headings
    nav_stats_title: 'Statistics',
    nav_label_dataCount: 'Points:',
    nav_label_voxelCount: 'Voxels:',
    nav_label_maxValue: 'Max:',
    nav_label_minValue: 'Min:',
    detail_title: 'Details',
    autosize_title: 'Auto Sizing',
    autosize_adjusted: 'Auto-adjust:',
    autosize_size: 'Size:',
    or_title: 'Outline Statistics',
    or_calls: 'Calls',
    or_avg: 'Avg',
    or_minmax: 'Min/Max',
    or_dminmax: 'D-Min/Max',
    or_topn: 'Top-N',
    loading: 'Loading...',

    // Toolbar base
    playground_title: 'Cesium Heatbox Playground',
    subtitle: 'Advanced controls',
    label_language: 'Language',
    lang_en: 'English',
    lang_ja: '日本語',

    // Data
    sum_data: 'Data Source',
    label_dataSource: 'Data Source',
    btn_load_sample: 'Load Sample Data',
    btn_generate_test: 'Generate Test Data',

    // Profiles (v0.1.12)
    sum_profiles: 'Configuration Profiles (v0.1.12)',
    label_profile: 'Profile',
    opt_profile_custom: 'Custom (No Profile)',
    opt_profile_mobile: 'Mobile Fast',
    opt_profile_desktop: 'Desktop Balanced',
    opt_profile_dense: 'Dense Data',
    opt_profile_sparse: 'Sparse Data',
    profile_desc_custom: 'Customize all settings manually',
    profile_desc_mobile: 'Mobile devices — performance first',
    profile_desc_desktop: 'Balanced desktop profile',
    profile_desc_dense: 'For high-density datasets',
    profile_desc_sparse: 'For sparse datasets',

    // Basic config
    sum_basic: 'Basic Configuration',
    label_baseMap: 'Base Map',
    chk_autoView: 'Auto View',
    label_fitViewHeading: 'Fit View Heading Degrees (v0.1.12)',
    label_fitViewPitch: 'Fit View Pitch Degrees (v0.1.12)',
    btn_fitView: 'Fit View',

    // Performance overlay (v0.1.12)
    sum_performance: 'Performance Overlay (v0.1.12)',
    chk_performanceOverlay: 'Enable Performance Overlay',
    label_overlayPosition: 'Overlay Position',
    opt_pos_topleft: 'Top Left',
    opt_pos_topright: 'Top Right',
    opt_pos_bottomleft: 'Bottom Left',
    opt_pos_bottomright: 'Bottom Right',
    label_overlayUpdate: 'Update Interval (ms)',

    // Voxel config
    sum_voxel: 'Voxel Configuration',
    chk_autoVoxel: 'Auto Voxel Size',
    label_autoVoxelMode: 'Auto Voxel Mode',
    opt_autoVoxel_simple: 'Simple',
    opt_autoVoxel_occupancy: 'Occupancy',
    label_gridSize: 'Grid Size',

    // Emulation & outlines
    h4_outline_emulation: 'Thick Line Emulation (WebGL Constraint Workaround)',
    label_emulationScope: 'Emulation Scope (v0.1.12)',
    opt_emul_off: 'Disabled',
    opt_emul_topn: 'Top-N Only',
    opt_emul_non_topn: 'Non-TopN Only',
    opt_emul_all: 'All Voxels',
    label_legacyEmulation: '⚠️ Legacy outlineEmulation (Deprecated)',
    label_outlineRenderMode: 'Render Mode',
    opt_render_standard: 'Standard',
    opt_render_inset: 'Inset Priority',
    opt_render_emulation: 'Emulation Only',

    // Adaptive
    h4_adaptive_control: 'Adaptive Control',
    chk_adaptiveOutlines: 'Enable Adaptive Outline Control',
    label_outlinePreset: 'Outline Preset (v0.1.12 Updated)',
    opt_preset_thin: 'Thin',
    opt_preset_medium: 'Medium',
    opt_preset_thick: 'Thick',
    opt_preset_adaptive: 'Adaptive',
    opt_preset_uniform_legacy: '⚠️ Uniform (Deprecated → Medium)',
    opt_preset_density_legacy: '⚠️ Density Adaptive (Deprecated → Adaptive)',
    opt_preset_topn_legacy: '⚠️ Top-N Focus (Deprecated → Thick)',

    // Debug & actions
    h4_debug_dev: 'Debug & Development',
    chk_debugMode: 'Debug Mode (Log Output)',
    chk_showBounds: 'Show Boundary Boxes',
    btn_testHeatbox: 'Test Heatbox',
    btn_getEffectiveOptions: '🆕 Get Effective Options (v0.1.12)',
    sum_actions: 'Actions',
    btn_create: 'Create Heatmap',
    btn_clear: 'Clear',
    btn_toggle: 'Toggle Visibility',
    btn_export: 'Export Data'
  };
})(window);


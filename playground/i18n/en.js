// English translations for Cesium Heatbox Playground
if (typeof window !== 'undefined') {
  window.HeatboxI18N = window.HeatboxI18N || {};
  window.HeatboxI18N.en = {
    // Profile descriptions
    profile_desc_custom: 'Customize all settings manually',
    profile_desc_mobile: 'Optimized for mobile devices: Fast rendering, reduced quality',
    profile_desc_desktop: 'Balanced performance for desktop environments',
    profile_desc_dense: 'Optimized for high-density datasets with many data points',
    profile_desc_sparse: 'Optimized for sparse datasets with fewer data points',
    
    // Extended UI labels
    sum_profiles: 'Configuration Profiles',
    label_profile: 'Profile',
    opt_profile_custom: 'Custom (No Profile)',
    opt_profile_mobile: 'Mobile Fast',
    opt_profile_desktop: 'Desktop Balanced',
    opt_profile_dense: 'Dense Data',
    opt_profile_sparse: 'Sparse Data',
    
    sum_performance: 'Performance Overlay',
    chk_performanceOverlay: 'Enable Performance Overlay',
    label_overlayPosition: 'Overlay Position',
    opt_pos_topleft: 'Top Left',
    opt_pos_topright: 'Top Right',
    opt_pos_bottomleft: 'Bottom Left',
    opt_pos_bottomright: 'Bottom Right',
    label_overlayUpdate: 'Update Interval (ms)',
    
    label_emulationScope: 'Emulation Scope',
    label_legacyEmulation: '⚠️ Legacy outlineEmulation (Deprecated)',
    opt_legacy_none: 'Use emulationScope above',
    
    btn_getEffectiveOptions: 'Get Effective Options',
    
    // Preset updates
    opt_preset_thin: 'Thin',
    opt_preset_medium: 'Medium', 
    opt_preset_thick: 'Thick',
    opt_preset_adaptive: 'Adaptive',
    opt_preset_uniform_legacy: '⚠️ Uniform (Deprecated → Medium)',
    opt_preset_density_legacy: '⚠️ Density Adaptive (Deprecated → Adaptive)',
    opt_preset_topn_legacy: '⚠️ Top-N Focus (Deprecated → Thick)'
    ,
    // View Mode (Playground)
    sum_viewmode: 'View Mode',
    label_viewmode_preset: 'Preset',
    opt_view_boxes: 'Boxes Only',
    opt_view_outline: 'Outline Only',
    opt_view_outline_inset: 'Outline + Inset',
    opt_view_emulation: 'Emulation Only'
  };
}

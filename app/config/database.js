const fs = require('fs');

module.exports = {
    "connection": {
        'user': 'doadmin',
        'password': 'xaikjabounn01k3i',
        'host': 'saidb-do-user-6679940-0.db.ondigitalocean.com',
        'port': 25060,
        'database': 'saidb',
        'dialect': 'mysql',
        'logging': true,
        'force': false,
        'timezone': '+00:00',
        'pool': {
            max: 100,
            min: 0,
            idle: 200000,
            acquire: 1000000,
        },
        'ssl': true,
        'dialectOptions': {
            ssl: {
                ssl: true,
                cert: fs.readFileSync('app/config/ca-certificate.crt')
            }
        },
    },

    /*'connection': {
        'host': 'localhost',
        'user': 'root',
        'port' : 3306,
        'database': 'sai_test',
        'password': 'E5i5wks15',
        'multipleStatements': true
    },*/

    //Database
    'database': 'saidb',
    /*'creoDatabase': 'creoDB',
    'database2': 'quotePricing',
    'masterDatabase': 'saidb',*/

    //Pre-loaded Static Tables (Shared b/w apps)
    'permissions_table': 'userPermissions',
    'jobscope_codes_table': 'jobscopeCatCodes',
    'layout_paramTypes_table':'layoutParamTypes',
    'layout_paramType_restrictions': 'layoutParamRestrictions',
    'secType_table':'sectionType',
    'brkType_table': 'brkType',
    'brkAcc_options_table': 'brkAccOptions',
    'control_assemblies_table': 'controlAsmSum',
    'control_items_table': 'controlItemSum',
    'breakerDropdown_options_table': 'breakerDropdownOptions',

    //Standard Design Tables (Shared b/w apps)
    'panelboard_amp_type': 'panelboardAmpType',
    'base_panel_copper_3W': 'basePanelCopper3W',
    'base_panel_copper_4W': 'basePanelCopper4W',
    'add_Copper_Per_Panel_3WType': 'addCopperPerPanel3WType',
    'add_Copper_Per_Panel_4WType': 'addCopperPerPanel4WType',
    'quote_system_type': 'quoteSystemType',
    'panelboard_width_3W': 'panelboardWidth3W',
    'panelboard_width_4W': 'panelboardWidth4W',

    //Product Catalog Tables
    'prod_productFamily_table': 'productFamily_prod',
    'prod_productLine_table': 'productLine_prod',
    'prod_systemVoltage_LV_table': 'systemVoltageLV_prod',
    'prod_systemVoltage_MV_table': 'systemVoltageMV_prod',
    'prod_currentRating_table': 'currentRating_prod',
    'prod_interruptingRating_LV_table': 'interruptingRatingLV_prod',
    'prod_interruptingRating_MV_table': 'interruptingRatingMV_prod',
    'prod_enclosure_table': 'enclosure_prod',
    'prod_finish_table': 'finish_prod',
    'prod_accessibility_table': 'accessibility_prod',
    'prod_controlVoltage_table': 'controlVoltage_prod',

    //SlimVAC Section Catalog Tables
    'secSV_productLine_table': 'productLine_secSV',
    'secSV_sectionType_table': 'sectionType_secSV',
    'secSV_brkMfg_table': 'brkMfg_secSV',
    'secSV_upperComp_table': 'upperComp_secSV',
    'secSV_lowerComp_table': 'lowerComp_secSV',
    'secSV_kaRating_table': 'kaRating_secSV',
    'secSV_mainBusRating_table': 'mainBusRating_secSV',
    'secSV_enclosureWidth_table': 'enclosureWidth_secSV',
    'secSV_enclosureType_table': 'enclosureType_secSV',
    'secSV_cableEntry_table': 'cableEntry_secSV',


    //SlimVAC AR Section Catalog Tables
    'secSVAR_productLine_table': 'productLine_secSVAR',
    'secSVAR_sectionType_table': 'sectionType_secSVAR',
    'secSVAR_brkMfg_table': 'brkMfg_secSVAR',
    'secSVAR_upperComp_table': 'upperComp_secSVAR',
    'secSVAR_lowerComp_table': 'lowerComp_secSVAR',
    'secSVAR_kaRating_table': 'kaRating_secSVAR',
    'secSVAR_mainBusRating_table': 'mainBusRating_secSVAR',
    'secSVAR_enclosureWidth_table': 'enclosureWidth_secSVAR',
    'secSVAR_enclosureType_table': 'enclosureType_secSVAR',
    'secSVAR_cableEntry_table': 'cableEntry_secSVAR',


    //Series 1 Section Catalog Tables
    'secS1_productLine_table': 'productLine_secS1',
    'secS1_brkMfg_table': 'brkMfg_secS1',
    'secS1_busLams_table': 'busLams_secS1',
    'secS1_chassisType_table': 'chassisType_secS1',
    'secS1_tieRacks_table': 'tieRacks_secS1',
    'secS1_mainBusRating_table': 'mainBusRating_secS1',
    'secS1_interiorHeight_table': 'interiorHeight_secS1',
    'secS1_enclosureType_table': 'enclosureType_secS1',
    'secS1_accessibility_table': 'accessibility_secS1',
    'secS1_cabHeight_table': 'cabHeight_secS1',
    'secS1_cabWidth_table': 'cabWidth_secS1',
    'secS1_cabDepth_table': 'cabDepth_secS1',
    'secS1_ctrlBoxSize_table': 'ctrlBoxSize_secS1',
    'secS1_cableEntry_table': 'cableEntry_secS1',


    //Series 2 Section Catalog Tables
    'secS2_productLine_table': 'productLine_secS2',
    'secS2_brkMfg_table': 'brkMfg_secS2',
    'secS2_secBusRating_table': 'secBusRating_secS2',
    'secS2_mainBusRating_table': 'mainBusRating_secS2',
    'secS2_enclosureType_table': 'enclosureType_secS2',
    'secS2_accessibility_table': 'accessibility_secS2',
    'secS2_cabHeight_table': 'cabHeight_secS2',
    'secS2_cabWidth_table': 'cabWidth_secS2',
    'secS2_cabDepth_table': 'cabDepth_secS2',
    'secS2_cableEntry_table': 'cableEntry_secS2',


    //Series 3 Section Catalog Tables
    'secS3_productLine_table': 'productLine_secS3',
    'secS3_brkMfg_table': 'brkMfg_secS3',
    'secS3_secBusRating_table': 'secBusRating_secS3',
    'secS3_mainBusRating_table': 'mainBusRating_secS3',
    'secS3_enclosureType_table': 'enclosureType_secS3',
    'secS3_accessibility_table': 'accessibility_secS3',
    'secS3_compA_table': 'compA_secS3',
    'secS3_compB_table': 'compB_secS3',
    'secS3_compC_table': 'compC_secS3',
    'secS3_compD_table': 'compD_secS3',
    'secS3_cabHeight_table': 'cabHeight_secS3',
    'secS3_cabWidth_table': 'cabWidth_secS3',
    'secS3_cabDepth_table': 'cabDepth_secS3',
    'secS3_cableEntry_table': 'cableEntry_secS3',


    //ANSI Std. Section Catalog Tables
    'secANSI_productLine_table': 'productLine_secANSI',
    'secANSI_sectionType_table': 'sectionType_secANSI',
    'secANSI_brkMfg_table': 'brkMfg_secANSI',
    'secANSI_upperComp_table': 'upperComp_secANSI',
    'secANSI_lowerComp_table': 'lowerComp_secANSI',
    'secANSI_systemVolt_table': 'systemVolt_secANSI',
    'secANSI_kaRating_table': 'kaRating_secANSI',
    'secANSI_mainBusRating_table': 'mainBusRating_secANSI',
    'secANSI_enclosureWidth_table': 'enclosureWidth_secANSI',
    'secANSI_enclosureType_table': 'enclosureType_secANSI',
    'secANSI_cableEntry_table': 'cableEntry_secANSI',


    //Creo Tables
    'baseFrame_table': 'baseFrames',
    'cornerPost_table': 'cornerPosts',
    'brkCompartment_NW_table': 'brkCompartments_NW',
    'brk_NW_table': 'iccbNW',
    'brkCompartment_Emax2_table': 'brkCompartments_Emax2',
    'brk_Emax2_table': 'iccbEmax2',
    'brk_powerpact_table': 'mccbPowerpact',
    'brk_tmax_table': 'mccbTmax',
    'brk_lugLanding_table': 'brkLugLandings',
    'oneLineParts_table': 'oneLineParts',
    'standardPanel_table': 'standardPanels',
    'panel_enclosureRules_table':'panelEnclosureRules',
    'filler_rails_table': 'fillerRails',
    'panel_fillers_table': 'panelFillers',
    'panelSupport_rails_table':'panelSupportRails',

    //User Login and Profile Tables
    'users_table':'users',
    'user_profile_table': 'userProfile',

    //Apps Eng Quote Tables
    'quote_summary_table':'quoteSum',
    'quote_rev_table': 'quoteRevSum',
    'quote_layout_table':'quoteLayoutSum',
    'quote_parts_labor_table':'quotePartsLaborSum',
    'quote_field_service_table':'quoteFieldServiceSum',
    'quote_freight_table':'quoteFreightSum',
    'quote_warranty_table':'quoteWarrantySum',
    'quote_section_table': 'quoteSectionSum',
    'quote_breaker_table': 'quoteBrkSum',
    'quote_brkAcc_table': 'quoteBrkAccSum',
    'quote_item_table': 'quoteItemSum',
    'quote_common_items': 'quoteComItem',
    'quote_user_items': 'quoteUserItem',
    'quote_control_sum': 'quoteControlSum',
    'panelboard_sum': 'panelboardSum',

    //Quote Pricing DB Tables
    'quotePricing_matCost': 'matCost',
    'quotePricing_density': 'density',
    'quotePricing_nemaTypes': 'nemaTypes',
    'quotePricing_trolleyTrack': 'trolleyTrackPricing',
    'quotePricing_mimicBus': 'mimicBusPricing',
    'quotePricing_fanHoods': 'fanHoodsPricing',
    'quotePricing_rearBarrier': 'rearBarrierPricing',
    'quotePricing_controlCub': 'controlCubPricing',
    'quotePricing_seismic': 'seismicPricing',
    'quotePricing_iccbComp': 'iccbCompPricing',
    'quotePricing_mccbComp': 'mccbCompPricing',
    'quotePricing_panel': 'panelPricing',
    'quotePricing_tvss': 'tvssPricing',
    'quotePricing_ct': 'ctPricing',
    'quotePricing_pt': 'ptPricing',
    'quotePricing_section': 'sectionPricing',
    'quotePricing_access': 'accessPricing',
    'quotePricing_copperTypes': 'copperPricing',
    'quotePricing_bracingTypes': 'bracingPricing',
    'quotePricing_secBusType': 'secBusPricing',
    'quotePricing_laborRates': 'laborRates',

    //Mechanical Eng MBOM Tables
    'MBOM_summary_table': 'mbomSum',
    'MBOM_breaker_table': 'mbomBrkSum',
    'MBOM_brkAcc_table': 'mbomBrkAccSum',
    'MBOM_item_table': 'mbomItemSum',
    'MBOM_common_items': 'mbomComItem',
    'MBOM_user_items': 'mbomUserItem',
    'MBOM_section_sum': 'mbomSectionSum',
    'MBOM_new_section_sum' : 'mbomNewSectionSum',

    //Mechanical Eng Submittal Tables
    'submittal_summary_table': 'submittalSum',
    'submittal_rev_table': 'submittalRevSum',
    'submittal_layout_table': 'submittalLayoutSum',
    'submittal_layout_dropdowns': 'layoutDropdownSum',
    'submittal_sections_table': 'submittalSectionSum',
    'submittal_panels_table': 'submittalPanelSum',
    'submittal_panel_breakers': 'submittalPanelBrkSum',
    'submittal_secType_table': 'sectionTypes',
    'submittal_breaker_table': 'submittalBrkSum',
    'submittal_brkAcc_table': 'submittalBrkAccSum',
    'submittal_brkAcc_options': 'submittalBrkAccOptions'
};

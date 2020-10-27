function reverseEngineerLayout() {
    let familyCode, lineCode, systemVoltCode, currentRatingCode, interruptingRatingCode, enclosureCode, finishCode, accessibilityCode, controlVoltCode;
    let instanceID, family, line, systemVolt, currentRating, interruptingRating, enclosure, finish, accessibility, controlVolt;
    let layoutCatalogPN = document.getElementById('layoutCatalogPN').value;
    if (layoutCatalogPN.length == 19) {
        instanceID = layoutCatalogPN.split('-')[1];
        familyCode = layoutCatalogPN.slice(0,2);
        document.getElementById('lineCode').value = layoutCatalogPN.slice(2,3);
        document.getElementById('systemVoltCode').value = layoutCatalogPN.slice(3,5);
        document.getElementById('currentRatingCode').value = layoutCatalogPN.slice(5,7);
        document.getElementById('interruptingRatingCode').value = layoutCatalogPN.slice(7,8);
        document.getElementById('enclosureCode').value = layoutCatalogPN.slice(8,9);
        document.getElementById('finishCode').value = layoutCatalogPN.slice(9,10);
        document.getElementById('accessibilityCode').value = layoutCatalogPN.slice(10,11);
        document.getElementById('controlVoltCode').value = layoutCatalogPN.slice(11,12);
    }
}
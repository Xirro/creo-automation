function openBreakerAccessories(el) {
    // accept either the element passed in, or fetch by id
    try {
        var checkbox = null;
        if (el && el.nodeType === 1) checkbox = el;
        else checkbox = document.getElementById('addAccessories');
        var container = document.getElementById('breakerAccessoriesDiv');
        if (!checkbox || !container) return;
        if (checkbox.checked === true) {
            container.style.display = "flex";
        } else {
            container.style.display = "none";
        }
    } catch (err) {
        console.error('openBreakerAccessories error', err);
    }
}

// Ensure the checkbox toggles the accessories panel even if no data-fn binding is present
document.addEventListener('DOMContentLoaded', function(){
    try {
        var el = document.getElementById('addAccessories');
        if (el) {
            // bind to change so both click and keyboard toggles work
            el.addEventListener('change', function(e){
                openBreakerAccessories(this);
            });
        }
    } catch (err) { console.error('mbomCheckbox init error', err); }
});
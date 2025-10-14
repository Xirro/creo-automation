function openBreakerAccessories() {
    let el = document.getElementById('addAccessories');
    if(el.checked == true){
        document.getElementById('breakerAccessoriesDiv').style.display = "flex";
    } else {
        document.getElementById('breakerAccessoriesDiv').style.display = "none";
    }
}


function Av2ViewModel()
{
    var self = this;
    
    self.MAXPOINTS = MAXPOINTS;
    self.MAXSPECIALIZATION = MAXSPECIALIZATION;
    
    // self.pointsSpent = ko.observable(State.pointsSpent);
    self.pointsAvailable = ko.observable(State.pointsAvailable);
    self.specPointsAvailable = ko.observable(State.specPointsAvailable);
    
    self.selectedClass = ko.observable(State.selectedClass);
    self.skillTree = ko.observable(State.skillTree);
}

ko.applyBindings(new Av2ViewModel());






// This is a simple *viewmodel* - JavaScript that defines the data and behavior of your UI
function AppViewModel()
{
    this.firstName = ko.observable("Bert");
    this.lastName = ko.observable("Bertington");
    
    this.fullName = ko.computed(function()
    {
        return this.firstName() + " " + this.lastName();
    }, this);
    
    this.capitalizeLastName = function()
    {
        var currentVal = this.lastName();        // Read the current value
        this.lastName(currentVal.toUpperCase()); // Write back a modified value
    };
}


// Find a better place for this later
if (!String.format) 
{
    String.format = function(format)
    {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/\{(\d+)\}/g, function(match, number)
        {
            return (typeof args[number] != 'undefined') ? args[number] : match;
        });
    };
}

/**
 * TreeNode
 */
function TreeNode()
{
    this.level = 0;
    this._skill = null;
    
    this._directAncestors = [];
    this._directDescendants = [];
}
// Property: skill
Object.defineProperty(TreeNode.prototype, 'skill',
{
    get: function()
    {
        return this._skill;
    },
    set: function(newSkill)
    {
        this._skill = newSkill;
        this.level = newSkill.minLevel;
    },
    enumerable: true
});
// Property: nextLevelCost
Object.defineProperty(TreeNode.prototype, 'nextLevelCost',
{
    get: function()
    {
        if (this.level + 1 > this.skill.maxLevel)
            return Number.POSITIVE_INFINITY;
        
        return this.skill.levelCosts[this.level + 1];
    },
    enumerable: true
});
// Property: thisLevelCost
Object.defineProperty(TreeNode.prototype, 'thisLevelCost',
{
    get: function()
    {
        if (this.level == this.skill.minLevel)
            return 0;
        
        return this.skill.levelCosts[this.level];
    },
    enumerable: true
});
TreeNode.prototype._getAllAncestors = function()
{
    var all = this._directAncestors.slice();
    
    this._directAncestors.forEach(function(ancestor)
    {
        all = all.concat(ancestor._getAllAncestors());
    });
    
    return all;
}
TreeNode.prototype._getAllDescendants = function()
{
    var all = this._directDescendants.slice();
    
    this._directDescendants.forEach(function(descendant)
    {
        all = all.concat(descendant._getAllDescendants());
    });
    
    return all;
}
TreeNode.prototype.increaseOkay = function()
{
    var newLevel = this.level + 1;
    
    if (newLevel > this.skill.maxLevel)
        return false;
    
    return  this._getAllAncestors().every(function(ancestor)
            {
                return ancestor.level >= newLevel;
            }); // still returns true for an empty ancestors array
}
TreeNode.prototype.decreaseOkay = function()
{
    var newLevel = this.level - 1;
    
    if (newLevel < this.skill.minLevel)
        return false;
    
    return  this._getAllDescendants().every(function(descendant)
            {
                return descendant.level <= newLevel;
            }); // still returns true for an empty descendants array
}

/**
 * SkillTree
 */
function SkillTree(skills)
{
    this.Battle  =  [new TreeNode(), new TreeNode(), new TreeNode()];
    this.Power   =  [new TreeNode(), new TreeNode(), new TreeNode()];
    this.Utility =  [new TreeNode(), new TreeNode(), new TreeNode()];
    this.Master  =  [new TreeNode(), new TreeNode()];
    this.Orphan  =  [new TreeNode(), new TreeNode()];
    
    // Define bi-directional node relationships
    this.Battle[0]._directDescendants   = [ this.Battle[1], this.Power[1] ];
    this.Battle[1]._directDescendants   = [ this.Battle[2] ];
    this.Battle[1]._directAncestors     = [ this.Battle[0], this.Power[0] ];
    this.Battle[2]._directDescendants   = [ this.Master[0] ];
    this.Battle[2]._directAncestors     = [ this.Battle[1], this.Power[1] ];
    
    this.Power[0]._directDescendants    = [ this.Battle[1], this.Utility[1] ];
    this.Power[1]._directDescendants    = [ this.Battle[2], this.Power[2] ];
    this.Power[1]._directAncestors      = [ this.Battle[0], this.Utility[0] ];
    this.Power[2]._directAncestors      = [ this.Power[1] ];
    
    this.Utility[0]._directDescendants  = [ this.Power[1], this.Utility[1] ];
    this.Utility[1]._directDescendants  = [ this.Utility[2] ];
    this.Utility[1]._directAncestors    = [ this.Power[0], this.Utility[0] ];
    this.Utility[2]._directDescendants  = [ this.Master[1] ];
    this.Utility[2]._directAncestors    = [ this.Utility[1] ];
    
    this.Master[0]._directAncestors     = [ this.Battle[2] ];
    this.Master[1]._directAncestors     = [ this.Utility[2] ];
    
    // Assign skills to nodes
    this.Battle[0].skill = skills[0];
    this.Battle[1].skill = skills[1];
    this.Battle[2].skill = skills[2];
    
    this.Power[0].skill = skills[3];
    this.Power[1].skill = skills[4];
    this.Power[2].skill = skills[5];
    
    this.Utility[0].skill = skills[6];
    this.Utility[1].skill = skills[7];
    this.Utility[2].skill = skills[8];
    
    this.Master[0].skill = skills[9];
    this.Master[1].skill = skills[10];
    
    this.Orphan[0].skill = skills[11];
    this.Orphan[1].skill = skills[12];
}

/**
 * TargetType
 */
var TargetType =
{
    Melee:      "Melee Attack",
    Close:      "Close Attack",
    Missile:    "Missile",
    MagMissile: "Magical Missile",
    Self:       "Affects Self",
    Ally:       "Affects Single Ally",
    NearAllies: "Affects Nearby Allies",
    NearFoes:   "Affects Nearby Foes",
    NearAll:    "Affects Everyone Nearby",
    Cone:       "Cone Attack",
    Area:       "Area Attack",
    Passive:    "Passive"
}

/**
 * Skill
 */
function Skill(name, icon, maxLevel, minLevel) //, upgrade1, upgrade2, upgrade2Name)
{
    this.name = name;
    this.icon = icon;
    
    this.maxLevel = maxLevel || 10;
    this.minLevel = minLevel || 0;
    
    this.levelCosts = [0, 2];
    for (var i = 1; i < maxLevel; i++)
    {
        this.levelCosts.push(1);
    };
    
    this.baseAbility = null;
    this.baseDescription = "";
    
    this.upgrade1Level = null; // upgrade1 || null;
    this.upgrade1Description = null;
    
    this.upgrade2Level = null; // upgrade2 || null;
    this.upgrade2Name = null; // upgrade2Name || null;
    this.upgradeAbility = null;
    this.upgrade2Description = null;
}
// Packages relevant text for insertion into markup.
Skill.prototype.getInfo = function()
{
    var info =
    {
        name: this.name,
        icon: this.icon,
        
        description: this.baseDescription
    };
    
    info.upgrades = [];
    
    if (this.upgrade1Level)
    {
        info.upgrades.push(
        {
            when: `At level ${ this.upgrade1Level }:`,
            description: this.upgrade1Description
        });
    }
    if (this.upgrade2Level)
    {
        info.upgrades.push(
        {
            when: `At level ${ this.upgrade2Level }${ (this.upgrade2Name) ? ", gain" : "" }:`,
            name: this.upgrade2Name,
            description: this.upgrade2Description
        });
    }
    
    return info;
};

/**
 * Ability
 */
function Ability(name, icon, targetType, minLevel)
{
    this.name = name;
    this.icon = icon;
    this.minLevel = minLevel || 1;
    
    this.baseDescription = "";
    
    this.fatigue = null;
    this.cooldown = null;
    
    this.baseTarget = targetType;
    this.baseEffects = [];
    
    this.upgrade1Level = null;
    this.upgrade1Description = null;
    this.upgrade1Target = null;
    this.upgrade1Effects = [];
    
    this.upgrade2Level = null;
    this.upgrade2Description = null;
    this.upgrade2Target = null;
    this.upgrade2Effects = [];
}
Ability.prototype.getInfoForLevel = function(level)
{
    var info =
    {
        name: this.name,
        icon: this.icon,
        
        description: [this.baseDescription],
        
        targeting: this.baseTarget
    };
    
    if (this.fatigue && this.cooldown)
        info.costAndCooldown = `Fatigue: ${this.fatigue}. Turns to recover: ${this.cooldown}.`;
    
    var effectList = this.baseEffects;
    
    var upgrade = (level >= this.upgrade2Level) ? 2 : (level >= this.upgrade1Level) ? 1 : 0;
    if (upgrade >= 1)
    {
        if (this.upgrade1Description)
            info.description.push(this.upgrade1Description);
        
        if (this.upgrade1Target)
            info.targeting = this.upgrade1Target;
        
        effectList = effectList.concat(this.upgrade1Effects);
    }
    if (upgrade == 2)
    {
        if (this.upgrade2Description)
            info.description.push(this.upgrade2Description);
        
        if (this.upgrade2Target)
            info.targeting = this.upgrade2Target;
        
        effectList = effectList.concat(this.upgrade2Effects);
    }
    
    info.effects = effectList.map(function(effect)
    {
        return effect.getInfoForLevel(level);
    });
    
    if (level < this.minLevel)
        info.lockedMsg = "Your skills aren't high enough to use this ability.";
    
    return info;
};

/**
 * Effect
 */
function Effect(formatString)
{
    this.formatString = formatString;
}
Effect.prototype.getInfoForLevel = function(level)
{
    return this.formatString;
};


////// POPULATE GAME DATA

// var Avadon2 = {};

////// SKILLS
var Skills =
{
    Blade:  {},
    Shadow: {},
    Shaman: {},
    Sorc:   {},
    Tinker: {}    
};

// enclose to avoid cluttering global scope with temp vars
(function()
{
    var newSkill;
    var newBaseAbility;
    var newUpgradeAbility;
    
  //// == BLADEMASTER - BATTLE ==
    
  //// -- Melee Training --
    newSkill = new Skill("Meelee Training", "icon-dummy", 10, 1);
    newBaseAbility = new Ability(newSkill.name, "icon-basic-melee", TargetType.Meelee);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Makes your melee attacks more likely to hit and do more damage.";
    newBaseAbility.baseEffects = [new Effect("Physical damage.")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds 5%/level chance for attacks to also hit a nearby enemy.";
    newBaseAbility.upgrade1Effects = [new Effect("Physical damage to foe near target. (Chance)")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Stunning Bash";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.Meelee, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Delivers a vicious blow with your blade, doing more damage and stunning the target.";
    newUpgradeAbility.fatigue = 2;
    newUpgradeAbility.cooldown = 8;
    newUpgradeAbility.baseEffects =
    [
        new Effect("Physical damage."),
        new Effect("Stunned for 2 Turns.")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Skills.Blade.MeleeTraining = newSkill;
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;
    
  //// -- Archery Training --
    newSkill = new Skill("Archery Training", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, "icon-basic-ranged", TargetType.Missile);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Makes your bow attacks more likely to hit and do more damage.";
    newBaseAbility.baseEffects = [new Effect("Physical damage.")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Each level gives 5% higher chance of a critical hit.";
    newBaseAbility.upgrade1Effects = [new Effect("Increased crit chance.")];
    
    // Upgrade 2
    newSkill.upgrade2Level = 6;
    newSkill.upgrade2Name = "Sharpshooter Spray";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", TargetType.Area, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "Fires a rapid spray of arrows, striking everyone in an area.";
    newUpgradeAbility.fatigue = 2;
    newUpgradeAbility.cooldown = 10;
    newUpgradeAbility.baseEffects = [new Effect("Physical damage.")];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Skills.Blade.ArcheryTraining = newSkill;
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;
    
  /*// -- template --
    newSkill = new Skill("__TEMPLATE__", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, __TARGET_TYPE___);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "__BASE_DESCRIPTION__";
    newBaseAbility.fatigue = __MANA_COST__;
    newBaseAbility.cooldown = __COOLDOWN__;
    newBaseAbility.baseEffects = [new Effect("__EFFECT__")];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = __UPGRADE_1_LEVEL__;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "__UPGRADE_1_DESCRIPTION__";
    newBaseAbility.upgrade1Effects = [new Effect("__EFFECT__")];
    
    // Upgrade 2
    newSkill.upgrade2Level = __UPGRADE_2_LEVEL__;
    newSkill.upgrade2Name = "__TEMPLATEX0R__";
    newUpgradeAbility = new Ability(newSkill.upgrade2Name, "icon-dummy", __TARGET_TYPE___, newSkill.upgrade2Level);
    newSkill.upgrade2Description = newUpgradeAbility.baseDescription = "__UPGRADE_2_DESCRIPTION__";
    newUpgradeAbility.fatigue = __MANA_COST__;
    newUpgradeAbility.cooldown = __COOLDOWN__;
    newUpgradeAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    newSkill.upgradeAbility = newUpgradeAbility;
    Skills.__CLASS_KEY__.__SKILL_KEY__ = newSkill;
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;
  */
    
  //// == BLADEMASTER - POWER ==
  
  //// -- Path of the Shield --
    newSkill = new Skill("Path of the Shield", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Passive);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "Increases resistance to magical damage by 3%/level.";
    // newBaseAbility.baseEffects = [ new Effect("__EFFECT__") ];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = 3;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "Adds 4%/level chance to parry melee and missile attacks.";
    // newBaseAbility.upgrade1Effects = [ new Effect("__EFFECT__") ];
    
    // Upgrade 2
    newSkill.upgrade2Level = newBaseAbility.upgrade2Level = 7;
    newSkill.upgrade2Description = newBaseAbility.upgrade2Description = "Adds 6%/level chance to riposte melee and missile attacks.";
    // newBaseAbility.upgrade2Effects = [ new Effect("__EFFECT__") ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Skills.Blade.PathShield = newSkill;
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;
    
  /*// -- template --
    newSkill = new Skill("__TEMPLATE_PASSIVE__", "icon-dummy", 10);
    newBaseAbility = new Ability(newSkill.name, newSkill.icon, TargetType.Passive);
    
    newSkill.baseDescription = newBaseAbility.baseDescription = "__BASE_DESCRIPTION__";
    newBaseAbility.baseEffects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 1
    newSkill.upgrade1Level = newBaseAbility.upgrade1Level = __UPGRADE_1_LEVEL__;
    newSkill.upgrade1Description = newBaseAbility.upgrade1Description = "__UPGRADE_1_DESCRIPTION__";
    newBaseAbility.upgrade1Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // Upgrade 2
    newSkill.upgrade2Level = newBaseAbility.upgrade2Level = __UPGRADE_2_LEVEL__;
    newSkill.upgrade2Description = newBaseAbility.upgrade2Description = "__UPGRADE_2_DESCRIPTION__";
    newBaseAbility.upgrade2Effects =
    [
        new Effect("__EFFECT__")
    ];
    
    // assign
    newSkill.baseAbility = newBaseAbility;
    Skills.__CLASS_KEY__.__SKILL_KEY__ = newSkill;
    
    // reset
    newSkill = null;
    newBaseAbility = null;
    newUpgradeAbility = null;
  */  
})();

/// ABILITIES
// Avadon2.Abilities = {};


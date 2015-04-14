nudoru.createNameSpace('nudoru.utils.StringUtils');
nudoru.utils.StringUtils = {

  capitalizeFirstLetter: function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
  },

  toTitleCase: function(str) {
    return str.replace(/\w\S*/g, function(txt){
      return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
  },

  removeTags: function(str) {
     return str.replace(/(<([^>]+)>)/ig, '');
  },

  stripHTMLTags: function() {
    return this.replace(/<[^>]+>/gi,"");
  },

  ellipses: function(len) {
    return (this.length > len) ? this.substr(0, len) + "..." : this;
  }


};
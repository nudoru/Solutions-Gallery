var StringUtils = {

  capitalizeFirstLetter: function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
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
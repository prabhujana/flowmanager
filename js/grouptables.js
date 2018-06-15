// Copyright (c) 2018 Maen Artimy
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

$(function () {
  // Table template
  var tableTemplate = " <div class=\"card wide\"> \
      <div class=\"header\"><h1>{Title}</h1></div> \
      <div class=\"container\">{content}</div> \
      <div class=\"footing\">{footer}</div></div>";

  var dps = null;

  // remove underscore and switch to uppercase
  function hc(myString) {
  	return myString.replace("_"," ").replace(/\b\w/g, l => l.toUpperCase())
  }

  function toUser(str) {
    if (str == '4294967295') {
      return 'ANY';
    } /*else if (typeof str === 'object' && str.length == 0 ) {
      return 'DROP';
    }*/
    return str;
  }

  // Create the tab structure
  function buildTabs(dps) {
    // Add tab buttons
    var tabs = '<div class="tab">';
    for(var d in dps) {
      tabs += '<button class="tablinks">Switch_'+dps[d]+'</button>';
    }
    tabs += '</div>';
    $('#main').append(tabs);

    // Add empty containers for contents
    for(var d in dps) {
      $('#main').append('<div id="Switch_'+dps[d]+'" class="tabcontent"></div>');
    }

    // Fill the containers with flow tables
    for(var d in dps) {
      getGroups(dps[d]);
    } 

    // When a tab is clicked:
    // 1) Hide all contents,
    // 2) Make the clicked tab active, and
    // 3) Show the content of the active tab
    // 4) Save the new active tab in local storage
    $('.tablinks').on('click', function(e) {
      $('.tabcontent').hide();      
      $('.tablinks').removeClass("active");
      $(this).addClass("active");
      var id = $(this).text();
      $('#'+id).show();
      localStorage.setItem('activeTab', id);
    })

    var activeTab = localStorage.getItem('activeTab');
    if(activeTab !== null) {
      //setActiveTab(activeTab);
      $('button:contains('+ activeTab +')').addClass("active");
      $('#'+activeTab).show();
      //console.log(activeTab);
    } 
  }

  // Create Flow Tables
  function buildGroupTables(response) {
    // extract the group data
    gdesc = response.desc
    gstats = response.stats
    dpid = parseInt(Object.keys(gdesc)[0]);
    var groups = Object.values(gdesc)['0'];
    var stats = Object.values(gstats)['0'];

    // get the headers
    var col = ["bucket", "weight", "watch_group", "watch_port", "actions", "packet_count", "byte_count"];
    var header = "<thead><tr>"
    for(i=0; i<col.length; i++){
      header += '<th data-sort="number">' + hc(col[i]) + '</th>';
    }
    header += "</tr></thead>"

    // get the groups
    for (var i = 0; i < groups.length; i++) {
      var body = "<tbody>";
      var buckets = groups[i].buckets;
      //console.log(buckets)
      var raw = "<tr>";
      for (var j = 0; j < buckets.length; j++) {
        raw += "<td>"+j+"</td>" // the raw order
        bucket = buckets[j];
        bucketstat = stats[i].bucket_stats[j];
        for (var k = 1; k < col.length; k++) {
          if(bucket[col[k]] != null) {
            raw += "<td>" + toUser(bucket[col[k]]) + "</td>";
          } else if(bucketstat[col[k]] != null) {
            raw += "<td>" + bucketstat[col[k]] + "</td>";
          } else {
            raw += "<td>---</td>"; 
          }
        }
        raw += "</tr>";
      }
      body += raw + "</tbody>";
      var content = '<table class="sortable fixed">' + header + body + '</table>'
      var footer = "<table class='oneliner'><tr><td>Type: " + groups[i].type + "<td></td>"
                        + "<td>Duration: " + stats[i].duration_sec + "<td></td>"
                        + "<td>Refs: " + stats[i].ref_count + "<td></td></table>"
                           
      var card = tableTemplate
                .replace("{Title}", "Group: "+ groups[i].group_id)
                .replace("{content}", content)
                .replace("{footer}", footer)
      $('#Switch_'+dpid).append(card);
    }

  }

  // Get flow entries from server and build tables
  function getGroups(id) {
    var flows = null;
    $.get("/status", {status:"groups", dpid:id})
    .done( function(response) {
      buildGroupTables(response); 
    });
  };

  // Get the switches list from server and build the group tables
  function getSwitches(f) {
    $.get("/flowform","list=switches")
    .done( function(response) {
      if(response) {
        buildTabs(response);
      }
    })
    .fail( function() {
      $('#error').text("Cannot read switches!");
    })
  };

  // Get the last active tab
  function getActive() {
    var name;
    if(localStorage.getItem('activeTab') === null) {
        localStorage.setItem('name', name);
    } else {
        name = localStorage.getItem('name');
    }

  }

  // When the refresh button is clicked, clear the page and start over
  $('.refresh').on('click', function() {
    $('#main').html("");
    getSwitches();
  })


  getSwitches();
});

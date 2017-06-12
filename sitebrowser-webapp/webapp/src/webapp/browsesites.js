tool_obj =
{
	currentMode: 0,

	title: "BROWSE ETUDES SITES",
	showReset: true,

	minorModes:
	[
		{
			title: "Search",
			elementId: "browsesites_search",
			element: null,
			navBarElementId: "browsesites_search_navbar",
			toolActionsElementId: null,
			toolItemTableElementId: null,
			
			icon: "folder_page.png",

			navbar:
			[
				{title: "Search", icon: "search.png", access: "s", popup: "Search", click: function(){tool_obj.pageNum = 1; tool_obj.search(tool_obj);}},
				{title: "Clear", icon: "refresh.png", access: "c", popup: "Clear", right: true, click: function(){tool_obj.clear(tool_obj);}}
			],

			start: function(obj, mode)
			{
				var instSelect = $("#browsesites_institution");
				$(instSelect).empty();
				$(instSelect).append($("<option />", {value: "any", text: "Any"}));
				$.each(obj.institutions, function(index, inst)
				{
					$(instSelect).append($("<option />", {value: inst.code, text: inst.name}));
				});
				
				var termSelect = $("#browsesites_term");
				$(termSelect).empty();
				$(termSelect).append($("<option />", {value: "any", text: "Any"}));
				$.each(obj.terms, function(index, term)
				{
					$(termSelect).append($("<option />", {value: term.code, text: term.name}));
				});
				// termSelect.val(obj.selectedTerm);
				scrollToTop();
				adjustForNewHeight();
			}
		},
		{
			title: "Results",
			elementId: "browsesites_results",
			element: null,
			navBarElementId: "browsesites_results_navbar",
			toolActionsElementId: null,
			toolItemTableElementId: "browsesites_results_table",
			
			icon: "folder_page.png",

			navbar:
			[
				{title: "New Search", icon: "search.png", access: "s", popup: "New Search", click: function(){tool_obj.returnToSearch(tool_obj);}},
				{id: "browsesites_results_next", title: "Next Page", icon: "arrow_right.png", iconRight: true, right: true, access: "n", popup: "Next Page", click: function(){tool_obj.goToNextPage(tool_obj);}},
				{id: "browsesites_results_counts", right: true, text: ""},
				{id: "browsesites_results_prev", title: "Prev Page", icon: "arrow_left.png", right: true, access: "p", popup: "Previous Page", click: function(){tool_obj.goToPrevPage(tool_obj);}}
			],

			headers:
			[
			],

			start: function(obj, mode)
			{
				obj.adjustNextPrevPage(obj);
				scrollToTop();
				adjustForNewHeight();
			}
		},
		{
			title: "View",
			elementId: "browsesites_view",
			element: null,
			navBarElementId: "browsesites_view_navbar",
			toolActionsElementId: null,
			toolItemTableElementId: null,
			
			icon: "folder_page.png",

			navbar:
			[
				{title: "New Search", icon: "search.png", access: "s", popup: "New Search", click: function(){tool_obj.returnToSearch(tool_obj);}},
				{id: "browsesites_view_next", title: "Next", icon: "next.png", iconRight: true, right: true, access: "n", popup: "Next Site", click: function(){tool_obj.goToNextSite(tool_obj);}},
				{id: "browsesites_view_counts", right: true, text: "1 of 1"},
				{id: "browsesites_view_prev", title: "Prev", icon: "previous.png", right: true, access: "p", popup: "Previous Site", click: function(){tool_obj.goToPrevSite(tool_obj);}},
				{title: "Search Results", icon: "list.png", right: true, access: "r", popup: "Search Results", click: function(){tool_obj.returnToResults(tool_obj);}}
			],

			start: function(obj, mode)
			{
				obj.adjustNextPrev(obj);
				scrollToTop();
				adjustForNewHeight();
			}
		}
	],
	
	institutions:
	[
		{code: "cos", name: "College of the Siskiyous"},
		{code: "elac", name: "East Los Angeles College"},
		{code: "ecc", name: "El Camino College"},
		{code: "etu", name: "Etudes"},
		{code: "fh", name: "Foothill College"},
		{code: "hc", name: "Hartnell College"},
		{code: "ind", name: "Individual"},
		{code: "jpds", name: "J Productions Dental Seminars, Inc."},
		{code: "ltcc", name: "Lake Tahoe Community College"},
		{code: "lacc", name: "Los Angeles City College"},
		{code: "lahc", name: "Los Angeles Harbor College"},
		{code: "lamcitv", name: "Los Angeles Mission College - Instructional Television"},
		{code: "lavc", name: "Los Angeles Valley College"},
		{code: "mend", name: "Mendocino College"},
		{code: "jatc", name: "NORCAL JATC"},
		{code: "sjdc", name: "San Joaquin Delta College"},
		{code: "tc", name: "Taft College"},
		{code: "wlac", name: "West Los Angeles College"}
	],

	terms:
	[
		{code: "54", name: "Fall 2017"},
		{code: "53", name: "Summer 2017"},
		{code: "52", name: "Spring 2017"},
		{code: "51", name: "Winter 2017"},
		{code: "50", name: "Fall 2016"},
		{code: "49", name: "Summer 2016"},
		{code: "48", name: "Spring 2016"},
		{code: "47", name: "Winter 2016"},
		{code: "46", name: "Fall 2015"},
		{code: "45", name: "Summer 2015"},
		{code: "44", name: "Spring 2015"},
		{code: "43", name: "Winter 2015"}
	],

	termName : function(obj, termCode)
	{
		var rv = "Any";
		$.each(obj.terms, function(index, term)
		{
			if (term.code == termCode) rv = term.name;
		});

		return rv;
	},

	instName : function(obj, instCode)
	{
		var rv = "Any";
		$.each(obj.institutions, function(index, inst)
		{
			if (inst.code == instCode) rv = inst.name;
		});

		return rv;
	},

	siteId: null,
	sites: null,
	totalCount: 0,
	pageSize: 50,
	pageNum: 1,
	
	selectedTerm: null,
	selectedInst: null,

	start: function(obj, data)
	{
		setTitle(obj.title);
		$("input[name=browsesites_siteType]").change(function () {obj.typeChanged();});

		selectMinorMode(0, obj);
	},

	stop: function(obj, save)
	{
	},

	reset: function(obj)
	{
		obj.returnToSearch(obj);
	},

	search: function(obj)
	{
		var data = new Object();
		data.term = $("#browsesites_term").val();
		data.type = $("input:radio[name=browsesites_siteType]:checked").val();
		data.institution = $("#browsesites_institution").val();
		data.search = $("#browsesites_title").val();
		data.page = obj.pageNum.toString();
		data.pageSize = obj.pageSize.toString();

		obj.selectedTerm = data.term;
		obj.selectedInst = data.institution;

		requestCdp("sitebrowser_listPublicSites", data, function(data)
		{
			obj.populateResults(obj, data.sites, data.count);
			selectMinorMode(1, obj);
		});
	},

	clear: function(obj)
	{
		$("#browsesites_term").val("any");	
		$('input:radio[name=browsesites_siteType][value="course"]').prop('checked', true);
		$("#browsesites_institution").val("any");
		$("#browsesites_title").val("");
		obj.typeChanged();
	},

	returnToSearch: function(obj)
	{
		obj.clear(obj);
		selectMinorMode(0, obj);
	},

	returnToResults: function(obj)
	{
		selectMinorMode(1, obj);
	},

	typeChanged: function()
	{
		var siteType = $("input:radio[name=browsesites_siteType]:checked").val();
		if (siteType != "project")
		{
			$("#browsesites_termUi").removeClass("e3_offstage");
		}
		else
		{
			$("#browsesites_termUi").addClass("e3_offstage");				
		}

		adjustForNewHeight();
	},
 
	findSite: function(obj, siteId)
	{
		if (obj.sites == null) return null;
		var found = null;
		$.each(obj.sites, function(index, value)
		{
			if (value.siteId == siteId)
			{
				found = value;
			}
		});

		return found;
	},

	findSiteIndex: function(obj, siteId)
	{
		if (obj.sites == null) return null;
		var i = null;
		$.each(obj.sites, function(index, value)
		{
			if (value.siteId == siteId)
			{
				i = index;
			}
		});

		return i;
	},

	findPrevSiteId: function(obj, siteId)
	{
		if (obj.sites == null) return null;
		if (obj.sites.length == 0) return null;

		var index = obj.findSiteIndex(obj, siteId);
		if (index == null) return null;
		if (index == 0) return null;

		index--;

		if (obj.sites[index].published != 1)
		{
			return obj.findPrevSiteId(obj, obj.sites[index].siteId);
		}
		return obj.sites[index].siteId;
	},

	findNextSiteId: function(obj, siteId)
	{
		if (obj.sites == null) return null;
		if (obj.sites.length == 0) return null;

		var index = obj.findSiteIndex(obj, siteId);
		if (index == null) return null;
		if (index == obj.sites.length-1) return null;

		index++;
		
		if (obj.sites[index].published != 1)
		{
			return obj.findNextSiteId(obj, obj.sites[index].siteId);
		}
		return obj.sites[index].siteId;
	},

	populateResults: function(obj, sites, count)
	{
		obj.sites = sites;
		obj.totalCount = count;
		obj.siteId = null;

		var type = $("input:radio[name=browsesites_siteType]:checked").val();
		$("#browsesites_results_criteria_type").empty().html($("input:radio[name=browsesites_siteType]:checked").val());
		$("#browsesites_results_criteria_inst").empty().html(obj.instName(obj,$("#browsesites_institution").val()));
		if (type != "project")
		{
			$("#browsesites_results_criteria_term_container").removeClass("e3_offstage");	
			$("#browsesites_results_criteria_term").empty().html(obj.termName(obj,$("#browsesites_term").val()).toLowerCase());
		}
		else
		{
			$("#browsesites_results_criteria_term_container").addClass("e3_offstage");	
		}
		var search = $("#browsesites_title").val().toLowerCase();
		if (search.length == 0)
		{
			$("#browsesites_results_criteria_search_container").addClass("e3_offstage");
		}
		else
		{
			$("#browsesites_results_criteria_search_container").removeClass("e3_offstage");
			$("#browsesites_results_criteria_search").empty().html($("#browsesites_title").val().toLowerCase());				
		}

		$("#browsesites_results_count").empty().html(obj.totalCount);
		if (obj.totalCount == 1)
		{
			$("#browsesites_results_count_plural").addClass("e3_offstage");
		}
		else
		{
			$("#browsesites_results_count_plural").removeClass("e3_offstage");
		}

		$("#browsesites_results_table tbody").empty();
		$("#browsesites_noSites").addClass("offstage");

		var any = false;
		if (sites != null)
		{
			$.each(sites, function(index, value)
			{
				any = true;

				var tr = $("<tr />");
				$("#browsesites_results_table tbody").append(tr);
				
				// insert an in-table heading if we are at the start of a new term
				if (((index > 0) && (sites[index-1].term != value.term)) || (index == 0))
				{
					createHeaderTd(tr, obj.expandTerm(obj, value.term));
					
					// we need a new row!
					tr = $("<tr />");
					$("#browsesites_results_table tbody").append(tr);					
				}

				// title
				if (value.published == 1)
				{
					createHotTd(tr, value.title, function(){obj.goToSite(obj, value.siteId);return false;});
				}
				else
				{
					createTextTd(tr, value.title);
				}
			});
		}

		if (!any)
		{
			$("#browsesites_noSites").removeClass("offstage");
		}
	},

	expandTerm: function(obj, term)
	{
		if (term == null) return "";

		if (term.length == 3)
		{
			if (term.startsWith("F"))
			{
				return "Fall 20" + term.substring(1,3);
			}
			else if (term.startsWith("W"))
			{
				return "Winter 20" + term.substring(1,3);
			}
			return term;
		}
		else if (term.length == 4)
		{
			if (term.startsWith("SU"))
			{
				return "Summer 20" + term.substring(2,4);
			}
			else if (term.startsWith("SP"))
			{
				return "Spring 20" + term.substring(2,4);
			}
			return term;
		}

		return term;
	},

	goToNextSite: function(obj)
	{
		var nextId = obj.findNextSiteId(obj, obj.siteId);
		if (nextId != null) obj.goToSite(obj, nextId);
	},
	
	goToPrevSite: function(obj)
	{
		var prevId = obj.findPrevSiteId(obj, obj.siteId);
		if (prevId != null) obj.goToSite(obj, prevId);
	},

	adjustNextPrev: function(obj)
	{
		var index = obj.findSiteIndex(obj, obj.siteId);
		var nextId = obj.findNextSiteId(obj, obj.siteId);
		var prevId = obj.findPrevSiteId(obj, obj.siteId);

		$("#browsesites_view_counts").text(index+1 + " of " + obj.sites.length);
		if (prevId == null)
		{
			 $("#browsesites_view_prev").attr("disabled", "disabled");
		}
		else
		{
			 $("#browsesites_view_prev").removeAttr("disabled");
		}
		
		if (nextId == null)
		{
			 $("#browsesites_view_next").attr("disabled", "disabled");
		}
		else
		{
			 $("#browsesites_view_next").removeAttr("disabled");
		}
	},

	goToSite: function(obj, siteId)
	{
		var data = new Object();
		data.siteId = siteId;

		requestCdp("sitebrowser_browsePublicSite", data, function(data)
		{
			obj.populateSite(obj, data.site);
			selectMinorMode(2, obj);
		});
	},
	
	populateSite : function(obj, site)
	{
		obj.siteId = site.siteId;

		$("#browsesites_view_title").empty().text(site.title);
		
		$("#browsesites_view_info").addClass("e3_offstage");
		$("#browsesites_view_description").addClass("e3_offstage");
		$("#browsesites_view_item").addClass("e3_offstage");

		// use: home, info url, or description, whichever (in order) is defined
		if (site.homeItem != null)
		{			
			$("#browsesites_view_item_title").empty().text(site.homeItem.title);
			$("#browsesites_view_item_content").empty();
			loadContent("browsesites_view_item_content", site.homeItem, 600, function(){adjustForNewHeight();} /*,loading*/);
			$("#browsesites_view_item").removeClass("e3_offstage");
		}
		else if (site.infoUrl != null)
		{
			$("#browsesites_view_info").attr("src", site.infoUrl);
			// height from the site defintion?
			$("#browsesites_view_info").removeClass("e3_offstage");
		}
		else if (site.description != null)
		{
			$("#browsesites_view_description").empty().text(site.description);
			$("#browsesites_view_description").removeClass("e3_offstage");
		}

		$("#browsesites_view_annc").empty();
		$.each(site.pubAnncouncements, function(index, value)
		{
			$("#browsesites_view_annc")
				.append("<div style='margin:8px 8px 8px 8px;' />"
				+ "<div style='color:#555;background:#E8E8F0; padding:4px 8px 4px 8px;'><span style='font-weight: bold;' id='browsesites_view_annc_subject_" + index + "'></span>"
				+ "<span style='float:right; font-size: 0.8em;' id='browsesites_view_annc_header_" + index + "'></span></div>"
				+ "<div style='margin:8px 12px 20px 12px;' id='browsesites_view_annc_body_" + index + "'></div>"
				+ "</div>");
			$("#browsesites_view_annc_subject_" + index).text(value.subject);
			$("#browsesites_view_annc_header_" + index).text(value.from + " (" + value.date + ")");
			$("#browsesites_view_annc_body_" + index).load("/cdp/doc/pub_announcement" + value.ref, function() {adjustForNewHeight();});
		});
		
		$("#browsesites_view_syllabus").empty();
		if (site.hasSyllabus != null)
		{
			$("#browsesites_view_syllabus").load("/cdp/doc/pub_syllabus/" + site.siteId, function() {adjustForNewHeight();});
		}

		$("#browsesites_view_rsrc").empty();
		$.each(site.pubResources, function(index, value)
		{
			$("#browsesites_view_rsrc")
				.append("<div class='browsesites_rsrc' style='margin:8px 8px 8px 8px;'>"
				+ "<a id='browsesites_view_rsrc_link_" + index + "' target='_blank'><span id='browsesites_view_rsrc_name_" + index + "'></span></a>"
				+ "<span style='float:right; font-size: 0.8em;' id='browsesites_view_rsrc_info_" + index + "'></span>"
				+ "</div>");
			$("#browsesites_view_rsrc_name_" + index).text(value.name);
			$("#browsesites_view_rsrc_link_" + index).attr("href", value.url);
			$("#browsesites_view_rsrc_info_" + index).text(value.owner + " (" + value.date + ") " + value.size + " [" + value.type + "]");
		});
	},

	goToNextPage: function(obj)
	{
		var nextPage = obj.pageNum + 1;
		if ((((nextPage - 1) * obj.pageSize) + 1) > obj.totalCount)	
		{
			nextPage = 1;
		}
		obj.pageNum = nextPage;

		obj.search(obj);
	},
	
	goToPrevPage: function(obj)
	{
		var prevPage = obj.pageNum - 1;
		if (prevPage < 1)	
		{
			prevPage = Math.floor((obj.totalCount - 1) / obj.pageSize) + 1;
		}
		obj.pageNum = prevPage;

		obj.search(obj);
	},

	adjustNextPrevPage: function(obj)
	{
		if (obj.totalCount == 0)
		{
			$("#browsesites_results_counts").text("No Sites Found");
			$("#browsesites_results_prev").attr("disabled", "disabled");
			$("#browsesites_results_next").attr("disabled", "disabled");
		}
		else
		{
			var firstInPage = ((obj.pageNum - 1) * obj.pageSize) + 1;
			var lastInPage = firstInPage + obj.pageSize - 1;
			if (lastInPage > obj.totalCount) lastInPage = obj.totalCount;	
			var pages = Math.floor((obj.totalCount - 1) / obj.pageSize) + 1;

			$("#browsesites_results_counts").text(obj.pageNum + " of " + pages);
			
			if (obj.pageNum == 1)
			{
				 $("#browsesites_results_prev").attr("disabled", "disabled");
			}
			else
			{
				 $("#browsesites_results_prev").removeAttr("disabled");
			}
			
			if (obj.pageNum == pages)
			{
				 $("#browsesites_results_next").attr("disabled", "disabled");
			}
			else
			{
				 $("#browsesites_results_next").removeAttr("disabled");
			}
		}
	}
};

completeToolLoad();

/**********************************************************************************
 * $URL: https://source.etudes.org/svn/apps/sitebrowser/trunk/sitebrowser-webapp/webapp/src/java/org/etudes/sitebrowser/cdp/SiteBrowserCdpHandler.java $
 * $Id: SiteBrowserCdpHandler.java 6631 2013-12-16 01:06:37Z ggolden $
 ***********************************************************************************
 *
 * Copyright (c) 2013 Etudes, Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 **********************************************************************************/

package org.etudes.sitebrowser.cdp;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.etudes.cdp.api.CdpHandler;
import org.etudes.cdp.api.CdpStatus;
import org.etudes.cdp.util.CdpResponseHelper;
import org.etudes.homepage.api.HomeContent;
import org.etudes.homepage.api.HomeContentItem;
import org.etudes.homepage.api.HomePageService;
import org.sakaiproject.announcement.api.AnnouncementMessage;
import org.sakaiproject.announcement.api.AnnouncementService;
import org.sakaiproject.component.cover.ComponentManager;
import org.sakaiproject.content.api.ContentHostingService;
import org.sakaiproject.content.api.ContentResource;
import org.sakaiproject.exception.IdUnusedException;
import org.sakaiproject.exception.PermissionException;
import org.sakaiproject.javax.PagingPosition;
import org.sakaiproject.site.api.Site;
import org.sakaiproject.site.api.SiteService;
import org.sakaiproject.util.StringUtil;

/**
 */
public class SiteBrowserCdpHandler implements CdpHandler
{
	/** Our log (commons). */
	private static Log M_log = LogFactory.getLog(SiteBrowserCdpHandler.class);

	public String getPrefix()
	{
		return "sitebrowser";
	}

	public Map<String, Object> handle(HttpServletRequest req, HttpServletResponse res, Map<String, Object> parameters, String requestPath,
			String path, String authenticatedUserId) throws ServletException, IOException
	{
		if (requestPath.equals("listPublicSites"))
		{
			return dispatchListPublicSites(req, res, parameters, path);
		}
		else if (requestPath.equals("browsePublicSite"))
		{
			return dispatchBrowsePublicSite(req, res, parameters, path);
		}

		return null;
	}

	/**
	 * @return The AnnouncementService, via the component manager.
	 */
	private AnnouncementService announcementService()
	{
		return (AnnouncementService) ComponentManager.get(AnnouncementService.class);
	}

	/**
	 * @return The ContentHostingService, via the component manager.
	 */
	private ContentHostingService contentHostingService()
	{
		return (ContentHostingService) ComponentManager.get(ContentHostingService.class);
	}

	/**
	 * @return The HomePageService, via the component manager.
	 */
	private HomePageService homePageService()
	{
		return (HomePageService) ComponentManager.get(HomePageService.class);
	}

	/**
	 * @return The SiteService, via the component manager.
	 */
	private SiteService siteService()
	{
		return (SiteService) ComponentManager.get(SiteService.class);
	}

	@SuppressWarnings("unchecked")
	protected Map<String, Object> dispatchBrowsePublicSite(HttpServletRequest req, HttpServletResponse res, Map<String, Object> parameters,
			String path) throws ServletException, IOException
	{
		Map<String, Object> rv = new HashMap<String, Object>();

		// get the siteId parameter
		String siteId = (String) parameters.get("siteId");
		if (siteId == null)
		{
			M_log.warn("dispatchBrowsePublicSite - no siteId parameter");

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
			return rv;
		}

		Site site;
		try
		{
			site = siteService().getSite(siteId);
		}
		catch (IdUnusedException e)
		{
			M_log.warn("dispatchBrowsePublicSite - no siteId parameter");

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
			return rv;
		}

		// site must be published
		if (!site.isPublished())
		{
			M_log.warn("dispatchBrowsePublicSite - site not published: " + site.getId());

			// add status parameter
			rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
			return rv;
		}

		boolean hasAnnouncements = site.getToolForCommonId("sakai.announcements") != null;
		boolean hasSyllabus = site.getToolForCommonId("sakai.syllabus") != null;
		boolean hasHome = site.getToolForCommonId("e3.homepage") != null;
		boolean hasResources = site.getToolForCommonId("sakai.resources") != null;
		boolean hasOldHome = site.getToolForCommonId("sakai.iframe.site") != null;

		// build up a map to return - the main map has a single "site" map object
		Map<String, Object> siteMap = new HashMap<String, Object>();
		rv.put("site", siteMap);

		if (hasSyllabus) siteMap.put("hasSyllabus", CdpResponseHelper.formatBoolean(true));

		siteMap.put("title", site.getTitle());
		siteMap.put("siteId", site.getId());

		// for old-school pre-home page content
		if (hasOldHome)
		{
			siteMap.put("infoUrl", site.getInfoUrl());
			siteMap.put("description", StringUtil.trimToZero(site.getDescription()));
		}

		// for home-content sites
		if (hasHome)
		{
			HomeContent content = homePageService().getContent(siteId);
			if (!content.getCurrent().isEmpty())
			{
				HomeContentItem c = content.getCurrent().get(0);
				Map<String, Object> contentMap = new HashMap<String, Object>();
				siteMap.put("homeItem", contentMap);
				contentMap.put("title", c.getTitle());
				contentMap.put("source", c.getSource());
				contentMap.put("type", c.getType());
				contentMap.put("style", c.getStyle());
				contentMap.put("url", c.getUrl());
				if (c.getAltText() != null) contentMap.put("alt", c.getAltText());
			}
		}

		// public announcements
		List<Map<String, String>> anncs = new ArrayList<Map<String, String>>();
		siteMap.put("pubAnncouncements", anncs);
		if (hasAnnouncements)
		{
			String anncRef = announcementService().channelReference(site.getId(), SiteService.MAIN_CONTAINER);
			try
			{
				List<AnnouncementMessage> announcements = announcementService().getMessages(anncRef, null, 0, true, false, true);
				for (AnnouncementMessage annc : announcements)
				{
					Map<String, String> anncMap = new HashMap<String, String>();
					anncs.add(anncMap);
					anncMap.put("subject", annc.getAnnouncementHeader().getSubject());
					anncMap.put("from", annc.getAnnouncementHeader().getFrom().getDisplayName());
					anncMap.put("date", CdpResponseHelper.dateTimeDisplayInUserZone(annc.getAnnouncementHeader().getDate().getTime()));
					anncMap.put("ref", annc.getReference());
				}
			}
			catch (PermissionException e)
			{
				M_log.warn("dispatchBrowsePublicSite - getting announcements: " + e.toString());

				// add status parameter
				rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
				return rv;
			}
		}

		// get the public resources
		List<Map<String, String>> rsrcs = new ArrayList<Map<String, String>>();
		siteMap.put("pubResources", rsrcs);
		if (hasResources)
		{
			List<ContentResource> resources = contentHostingService().getAllResources(contentHostingService().getSiteCollection(site.getId()));
			for (ContentResource r : resources)
			{
				// if the user is logged in, we also get the user's resources - we want only pubview
				if (!contentHostingService().isPubView(r.getId())) continue;

				Map<String, String> rsrcMap = new HashMap<String, String>();
				rsrcs.add(rsrcMap);
				rsrcMap.put("size", r.getProperties().getPropertyFormatted(r.getProperties().getNamePropContentLength()));
				rsrcMap.put("type", r.getProperties().getPropertyFormatted(r.getProperties().getNamePropContentType()));
				rsrcMap.put("name", r.getProperties().getPropertyFormatted(r.getProperties().getNamePropDisplayName()));
				rsrcMap.put("owner", r.getProperties().getPropertyFormatted(r.getProperties().getNamePropCreator()));
				rsrcMap.put("date", r.getProperties().getPropertyFormatted(r.getProperties().getNamePropCreationDate()));
				rsrcMap.put("url", r.getUrl());
			}
		}

		// add status parameter
		rv.put(CdpStatus.CDP_STATUS, CdpStatus.success.getId());

		return rv;
	}

	@SuppressWarnings("unchecked")
	protected Map<String, Object> dispatchListPublicSites(HttpServletRequest req, HttpServletResponse res, Map<String, Object> parameters, String path)
			throws ServletException, IOException
	{
		Map<String, Object> rv = new HashMap<String, Object>();

		// get the term parameter
		String term = (String) parameters.get("term");
		Integer termCode = null;
		if (term != null)
		{
			if (!"any".equals(term))
			{
				try
				{
					termCode = Integer.parseInt(term);
				}
				catch (NumberFormatException e)
				{
					M_log.warn("dispatchListPublicSites - term parameter not numeric: " + term);

					// add status parameter
					rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
					return rv;
				}
			}
		}

		String type = (String) parameters.get("type");
		if (type != null)
		{
			if ("any".equals(type)) type = null;
		}

		String institution = (String) parameters.get("institution");
		if (institution != null)
		{
			if (institution.equals("any")) institution = null;
		}

		String search = (String) parameters.get("search");

		String page = (String) parameters.get("page");
		int pageNum = 1;
		if (page != null)
		{
			try
			{
				pageNum = Integer.parseInt(page);
			}
			catch (NumberFormatException e)
			{
				M_log.warn("dispatchListPublicSites - page parameter not numeric: " + page);

				// add status parameter
				rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
				return rv;
			}
		}

		String pageSize = (String) parameters.get("pageSize");
		int pageSizeNum = 50;
		if (pageSize != null)
		{
			try
			{
				pageSizeNum = Integer.parseInt(pageSize);
			}
			catch (NumberFormatException e)
			{
				M_log.warn("dispatchListPublicSites - pageSize parameter not numeric: " + pageSize);

				// add status parameter
				rv.put(CdpStatus.CDP_STATUS, CdpStatus.badRequest.getId());
				return rv;
			}
		}

		// page item numbers, 1 based
		int firstInPage = ((pageNum - 1) * pageSizeNum) + 1;
		int lastInPage = firstInPage + pageSizeNum - 1;

		// count the sites
		int count = siteService().countSites(SiteService.SelectionType.PUBVIEW, type, search, termCode, institution, null);

		// find a page of public sites
		List<Site> sites = siteService().getSites(SiteService.SelectionType.PUBVIEW, type, search, termCode, institution, null, /* SiteService.SortType.TITLE_ASC */
		SiteService.SortType.TERM_DESC, new PagingPosition(firstInPage, lastInPage));

		// build up a map to return - the main map has a "sites" array object
		List<Map<String, Object>> sitesMap = new ArrayList<Map<String, Object>>();
		rv.put("sites", sitesMap);

		// add the count, too
		rv.put("count", Integer.toString(count));

		// each site has a map with ...
		for (Site site : sites)
		{
			Map<String, Object> siteMap = new HashMap<String, Object>();
			sitesMap.add(siteMap);

			siteMap.put("title", site.getTitle());
			siteMap.put("siteId", site.getId());
			siteMap.put("term", site.getTermSuffix());
			siteMap.put("published", CdpResponseHelper.formatBoolean(site.isPublished()));
		}

		// add status parameter
		rv.put(CdpStatus.CDP_STATUS, CdpStatus.success.getId());

		return rv;
	}
}
